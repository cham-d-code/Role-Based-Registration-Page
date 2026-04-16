package com.tempstaff.service;

import com.tempstaff.dto.request.NotifyCurriculumModulesRequest;
import com.tempstaff.dto.request.SubmitModulePreferencesRequest;
import com.tempstaff.dto.response.CurriculumModuleResponse;
import com.tempstaff.dto.response.ModulePreferenceRequestResponse;
import com.tempstaff.entity.*;
import com.tempstaff.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModulePreferenceService {

    private final ModulePreferenceRequestRepository requestRepo;
    private final ModulePreferenceRequestModuleRepository requestModuleRepo;
    private final ModulePreferenceSubmissionRepository submissionRepo;
    private final ModulePreferenceSubmissionModuleRepository submissionModuleRepo;
    private final CurriculumModuleRepository curriculumModuleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private Map<UUID, UUID> latestRequestIdByStaff(Collection<UUID> staffIds) {
        if (staffIds == null || staffIds.isEmpty()) return Map.of();

        List<ModulePreferenceRequest> requests = requestRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        if (requests.isEmpty()) return Map.of();

        Map<UUID, UUID> out = new HashMap<>();
        Set<UUID> remaining = new HashSet<>(staffIds);

        for (ModulePreferenceRequest r : requests) {
            if (remaining.isEmpty()) break;

            UUID target = r.getTargetStaffId();
            if (target != null) {
                if (remaining.contains(target)) {
                    out.put(target, r.getId());
                    remaining.remove(target);
                }
                continue;
            }

            // Broadcast request: applies to everyone not already matched by a newer targeted request
            for (UUID sid : remaining) {
                out.put(sid, r.getId());
            }
            remaining.clear();
            break;
        }

        return out;
    }

    @Transactional
    public ModulePreferenceRequest createRequest(UUID createdBy, NotifyCurriculumModulesRequest req, List<User> recipients) {
        if (req.getModuleIds() == null || req.getModuleIds().isEmpty()) {
            throw new RuntimeException("moduleIds are required");
        }

        List<CurriculumModule> modules = curriculumModuleRepository.findAllById(req.getModuleIds());
        if (modules.size() != req.getModuleIds().size()) {
            throw new RuntimeException("One or more module ids are invalid");
        }

        ModulePreferenceRequest r = ModulePreferenceRequest.builder()
                .createdBy(createdBy)
                .targetStaffId(req.getStaffId())
                .message(req.getMessage())
                .build();
        r = requestRepo.save(r);

        for (UUID mid : req.getModuleIds()) {
            requestModuleRepo.save(ModulePreferenceRequestModule.builder()
                    .requestId(r.getId())
                    .moduleId(mid)
                    .build());
        }

        // Notify recipients (in-app notifications inbox)
        List<User> staff = (recipients == null) ? List.of() : recipients;
        String moduleCodes = modules.stream().map(CurriculumModule::getCode).sorted().collect(Collectors.joining(", "));
        String msg = (req.getMessage() == null || req.getMessage().isBlank())
                ? ("Please submit your preferred modules. Modules: " + moduleCodes)
                : (req.getMessage().trim() + "\n\nModules: " + moduleCodes);

        for (User s : staff) {
            notificationService.notifyUser(
                    s.getId(),
                    "Module preferences requested",
                    msg,
                    NotificationType.module_preferences_requested,
                    null,
                    null
            );
        }

        return r;
    }

    @Transactional(readOnly = true)
    public Optional<ModulePreferenceRequestResponse> getLatestRequestForStaff(UUID staffId) {
        List<ModulePreferenceRequest> latest = requestRepo.findLatestForStaff(staffId, org.springframework.data.domain.PageRequest.of(0, 1));
        if (latest.isEmpty()) return Optional.empty();

        ModulePreferenceRequest r = latest.get(0);
        boolean submitted = submissionRepo.findByRequestIdAndStaffId(r.getId(), staffId).isPresent();

        List<UUID> moduleIds = requestModuleRepo.findByRequestId(r.getId()).stream()
                .map(ModulePreferenceRequestModule::getModuleId)
                .collect(Collectors.toList());
        Map<UUID, CurriculumModule> moduleMap = curriculumModuleRepository.findAllById(moduleIds).stream()
                .collect(Collectors.toMap(CurriculumModule::getId, m -> m));

        List<CurriculumModuleResponse> modules = moduleIds.stream()
                .map(moduleMap::get)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(CurriculumModule::getAcademicLevel).thenComparing(CurriculumModule::getCode))
                .map(m -> CurriculumModuleResponse.builder()
                        .id(m.getId().toString())
                        .code(m.getCode())
                        .name(m.getName())
                        .chiefTutor(m.getChiefTutor())
                        .academicLevel(m.getAcademicLevel())
                        .semesterLabel(m.getSemesterLabel())
                        .credits(m.getCredits())
                        .compulsoryOptional(m.getCompulsoryOptional())
                        .programKind(m.getProgramKind())
                        .mitTrack(m.getMitTrack())
                        .build())
                .collect(Collectors.toList());

        return Optional.of(ModulePreferenceRequestResponse.builder()
                .id(r.getId().toString())
                .message(r.getMessage())
                .createdAt(r.getCreatedAt())
                .submittedByMe(submitted)
                .modules(modules)
                .build());
    }

    @Transactional
    public void submit(UUID staffId, SubmitModulePreferencesRequest req) {
        if (req == null || req.getRequestId() == null) throw new RuntimeException("requestId is required");
        if (req.getModuleIds() == null || req.getModuleIds().isEmpty()) throw new RuntimeException("moduleIds are required");

        ModulePreferenceRequest request = requestRepo.findById(req.getRequestId())
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Ensure submitted modules are part of the request
        Set<UUID> allowed = requestModuleRepo.findByRequestId(request.getId()).stream()
                .map(ModulePreferenceRequestModule::getModuleId)
                .collect(Collectors.toSet());
        for (UUID mid : req.getModuleIds()) {
            if (!allowed.contains(mid)) {
                throw new RuntimeException("One or more modules are not part of the requested list");
            }
        }

        ModulePreferenceSubmission submission = submissionRepo.findByRequestIdAndStaffId(request.getId(), staffId)
                .orElseGet(() -> submissionRepo.save(ModulePreferenceSubmission.builder()
                        .requestId(request.getId())
                        .staffId(staffId)
                        .build()));

        // Replace selection for idempotency
        submissionModuleRepo.deleteBySubmissionId(submission.getId());
        for (UUID mid : req.getModuleIds()) {
            submissionModuleRepo.save(ModulePreferenceSubmissionModule.builder()
                    .submissionId(submission.getId())
                    .moduleId(mid)
                    .build());
        }

        // Notify HOD + Coordinator that preferences were received
        String staffName = userRepository.findById(staffId).map(User::getFullName).orElse("Temporary staff");
        String codes = curriculumModuleRepository.findAllById(req.getModuleIds()).stream()
                .map(CurriculumModule::getCode)
                .sorted()
                .collect(Collectors.joining(", "));
        List<User> management = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.hod, UserRole.coordinator));
        String title = "Module preferences received";
        String msg = String.format(
                "%s submitted module preferences (%s). [requestId=%s, staffId=%s]",
                staffName,
                codes,
                request.getId(),
                staffId
        );
        for (User m : management) {
            notificationService.notifyUser(m.getId(), title, msg, NotificationType.info, null, null);
        }
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<String>> getLatestPreferredModuleCodesForStaff(Collection<UUID> staffIds) {
        if (staffIds == null || staffIds.isEmpty()) return Map.of();

        Map<UUID, UUID> staffToReq = latestRequestIdByStaff(staffIds);
        if (staffToReq.isEmpty()) return Map.of();

        // Group staff by request id
        Map<UUID, List<UUID>> reqToStaff = new HashMap<>();
        for (var e : staffToReq.entrySet()) {
            reqToStaff.computeIfAbsent(e.getValue(), k -> new ArrayList<>()).add(e.getKey());
        }

        Map<UUID, List<String>> out = new HashMap<>();

        for (var e : reqToStaff.entrySet()) {
            UUID reqId = e.getKey();
            List<UUID> groupStaff = e.getValue();

            List<ModulePreferenceSubmission> subs = submissionRepo.findByRequestIdAndStaffIdIn(reqId, groupStaff);
            if (subs.isEmpty()) continue;

            Map<UUID, UUID> staffToSubmission = subs.stream()
                    .collect(Collectors.toMap(ModulePreferenceSubmission::getStaffId, ModulePreferenceSubmission::getId));

            List<UUID> submissionIds = new ArrayList<>(staffToSubmission.values());
            Map<UUID, List<UUID>> submissionToModules = new HashMap<>();
            for (UUID sid : submissionIds) {
                List<UUID> mids = submissionModuleRepo.findBySubmissionId(sid).stream()
                        .map(ModulePreferenceSubmissionModule::getModuleId)
                        .collect(Collectors.toList());
                submissionToModules.put(sid, mids);
            }

            Set<UUID> allModuleIds = submissionToModules.values().stream().flatMap(List::stream).collect(Collectors.toSet());
            Map<UUID, CurriculumModule> moduleMap = curriculumModuleRepository.findAllById(allModuleIds).stream()
                    .collect(Collectors.toMap(CurriculumModule::getId, m -> m));

            for (var se : staffToSubmission.entrySet()) {
                UUID staffId = se.getKey();
                UUID submissionId = se.getValue();
                List<String> codes = submissionToModules.getOrDefault(submissionId, List.of()).stream()
                        .map(moduleMap::get)
                        .filter(Objects::nonNull)
                        .map(CurriculumModule::getCode)
                        .sorted()
                        .collect(Collectors.toList());
                out.put(staffId, codes);
            }
        }

        return out;
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<CurriculumModuleResponse>> getLatestPreferredModulesForStaff(Collection<UUID> staffIds) {
        if (staffIds == null || staffIds.isEmpty()) return Map.of();

        Map<UUID, UUID> staffToReq = latestRequestIdByStaff(staffIds);
        if (staffToReq.isEmpty()) return Map.of();

        Map<UUID, List<UUID>> reqToStaff = new HashMap<>();
        for (var e : staffToReq.entrySet()) {
            reqToStaff.computeIfAbsent(e.getValue(), k -> new ArrayList<>()).add(e.getKey());
        }

        Map<UUID, List<CurriculumModuleResponse>> out = new HashMap<>();

        for (var e : reqToStaff.entrySet()) {
            UUID reqId = e.getKey();
            List<UUID> groupStaff = e.getValue();

            List<ModulePreferenceSubmission> subs = submissionRepo.findByRequestIdAndStaffIdIn(reqId, groupStaff);
            if (subs.isEmpty()) continue;

            Map<UUID, UUID> staffToSubmission = subs.stream()
                    .collect(Collectors.toMap(ModulePreferenceSubmission::getStaffId, ModulePreferenceSubmission::getId));

            List<UUID> submissionIds = new ArrayList<>(staffToSubmission.values());
            Map<UUID, List<UUID>> submissionToModules = new HashMap<>();
            for (UUID sid : submissionIds) {
                List<UUID> mids = submissionModuleRepo.findBySubmissionId(sid).stream()
                        .map(ModulePreferenceSubmissionModule::getModuleId)
                        .collect(Collectors.toList());
                submissionToModules.put(sid, mids);
            }

            Set<UUID> allModuleIds = submissionToModules.values().stream().flatMap(List::stream).collect(Collectors.toSet());
            Map<UUID, CurriculumModule> moduleMap = curriculumModuleRepository.findAllById(allModuleIds).stream()
                    .collect(Collectors.toMap(CurriculumModule::getId, m -> m));

            for (var se : staffToSubmission.entrySet()) {
                UUID staffId = se.getKey();
                UUID submissionId = se.getValue();

                List<CurriculumModuleResponse> modules = submissionToModules.getOrDefault(submissionId, List.of()).stream()
                        .map(moduleMap::get)
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparing(CurriculumModule::getAcademicLevel).thenComparing(CurriculumModule::getCode))
                        .map(m -> CurriculumModuleResponse.builder()
                                .id(m.getId().toString())
                                .code(m.getCode())
                                .name(m.getName())
                                .chiefTutor(m.getChiefTutor())
                                .academicLevel(m.getAcademicLevel())
                                .semesterLabel(m.getSemesterLabel())
                                .credits(m.getCredits())
                                .compulsoryOptional(m.getCompulsoryOptional())
                                .programKind(m.getProgramKind())
                                .mitTrack(m.getMitTrack())
                                .build())
                        .collect(Collectors.toList());

                out.put(staffId, modules);
            }
        }

        return out;
    }

    @Transactional(readOnly = true)
    public Set<UUID> staffMissingSubmissionForLatestRequest(Collection<UUID> staffIds) {
        if (staffIds == null || staffIds.isEmpty()) return Set.of();

        Map<UUID, UUID> staffToReq = latestRequestIdByStaff(staffIds);
        if (staffToReq.isEmpty()) return Set.of();

        Map<UUID, List<UUID>> reqToStaff = new HashMap<>();
        for (var e : staffToReq.entrySet()) {
            reqToStaff.computeIfAbsent(e.getValue(), k -> new ArrayList<>()).add(e.getKey());
        }

        Set<UUID> missing = new HashSet<>();
        for (var e : reqToStaff.entrySet()) {
            UUID reqId = e.getKey();
            List<UUID> groupStaff = e.getValue();

            Set<UUID> submitted = submissionRepo.findByRequestIdAndStaffIdIn(reqId, groupStaff).stream()
                    .map(ModulePreferenceSubmission::getStaffId)
                    .collect(Collectors.toSet());

            for (UUID sid : groupStaff) {
                if (!submitted.contains(sid)) missing.add(sid);
            }
        }

        return missing;
    }
}

