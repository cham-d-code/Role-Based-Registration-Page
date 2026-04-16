package com.tempstaff.service;

import com.tempstaff.dto.request.NotifyCurriculumModulesRequest;
import com.tempstaff.dto.request.SubmitModulePreferencesRequest;
import com.tempstaff.dto.response.CurriculumModuleResponse;
import com.tempstaff.dto.response.ModulePreferenceRequestResponse;
import com.tempstaff.entity.*;
import com.tempstaff.repository.*;
import lombok.RequiredArgsConstructor;
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

    @Transactional
    public ModulePreferenceRequest createRequest(UUID createdBy, NotifyCurriculumModulesRequest req) {
        if (req.getModuleIds() == null || req.getModuleIds().isEmpty()) {
            throw new RuntimeException("moduleIds are required");
        }

        List<CurriculumModule> modules = curriculumModuleRepository.findAllById(req.getModuleIds());
        if (modules.size() != req.getModuleIds().size()) {
            throw new RuntimeException("One or more module ids are invalid");
        }

        ModulePreferenceRequest r = ModulePreferenceRequest.builder()
                .createdBy(createdBy)
                .message(req.getMessage())
                .build();
        r = requestRepo.save(r);

        for (UUID mid : req.getModuleIds()) {
            requestModuleRepo.save(ModulePreferenceRequestModule.builder()
                    .requestId(r.getId())
                    .moduleId(mid)
                    .build());
        }

        // Notify all approved staff (in-app notifications inbox)
        List<User> staff = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.staff));
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
        Optional<ModulePreferenceRequest> latest = requestRepo.findFirstByOrderByCreatedAtDesc();
        if (latest.isEmpty()) return Optional.empty();

        ModulePreferenceRequest r = latest.get();
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
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<String>> getLatestPreferredModuleCodesForStaff(Collection<UUID> staffIds) {
        Optional<ModulePreferenceRequest> latestReq = requestRepo.findFirstByOrderByCreatedAtDesc();
        if (latestReq.isEmpty() || staffIds == null || staffIds.isEmpty()) return Map.of();
        UUID reqId = latestReq.get().getId();

        // Load submissions for latest request
        List<ModulePreferenceSubmission> subs = submissionRepo.findByRequestIdAndStaffIdIn(reqId, staffIds);

        if (subs.isEmpty()) return Map.of();

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

        // Load curriculum module codes
        Set<UUID> allModuleIds = submissionToModules.values().stream().flatMap(List::stream).collect(Collectors.toSet());
        Map<UUID, CurriculumModule> moduleMap = curriculumModuleRepository.findAllById(allModuleIds).stream()
                .collect(Collectors.toMap(CurriculumModule::getId, m -> m));

        Map<UUID, List<String>> out = new HashMap<>();
        for (var e : staffToSubmission.entrySet()) {
            UUID staffId = e.getKey();
            UUID submissionId = e.getValue();
            List<String> codes = submissionToModules.getOrDefault(submissionId, List.of()).stream()
                    .map(moduleMap::get)
                    .filter(Objects::nonNull)
                    .map(CurriculumModule::getCode)
                    .sorted()
                    .collect(Collectors.toList());
            out.put(staffId, codes);
        }
        return out;
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<CurriculumModuleResponse>> getLatestPreferredModulesForStaff(Collection<UUID> staffIds) {
        Optional<ModulePreferenceRequest> latestReq = requestRepo.findFirstByOrderByCreatedAtDesc();
        if (latestReq.isEmpty() || staffIds == null || staffIds.isEmpty()) return Map.of();
        UUID reqId = latestReq.get().getId();

        List<ModulePreferenceSubmission> subs = submissionRepo.findByRequestIdAndStaffIdIn(reqId, staffIds);
        if (subs.isEmpty()) return Map.of();

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

        Map<UUID, List<CurriculumModuleResponse>> out = new HashMap<>();
        for (var e : staffToSubmission.entrySet()) {
            UUID staffId = e.getKey();
            UUID submissionId = e.getValue();

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
        return out;
    }

    @Transactional(readOnly = true)
    public Set<UUID> staffMissingSubmissionForLatestRequest(Collection<UUID> staffIds) {
        Optional<ModulePreferenceRequest> latestReq = requestRepo.findFirstByOrderByCreatedAtDesc();
        if (latestReq.isEmpty() || staffIds == null || staffIds.isEmpty()) return Set.of();
        UUID reqId = latestReq.get().getId();

        Set<UUID> submitted = submissionRepo.findByRequestIdAndStaffIdIn(reqId, staffIds).stream()
                .map(ModulePreferenceSubmission::getStaffId)
                .collect(Collectors.toSet());

        Set<UUID> missing = new HashSet<>(staffIds);
        missing.removeAll(submitted);
        return missing;
    }
}

