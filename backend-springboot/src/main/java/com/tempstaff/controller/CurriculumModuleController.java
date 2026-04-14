package com.tempstaff.controller;

import com.tempstaff.dto.request.NotifyCurriculumModulesRequest;
import com.tempstaff.dto.request.UpsertCurriculumModuleRequest;
import com.tempstaff.dto.response.CurriculumModuleResponse;
import com.tempstaff.entity.CurriculumModule;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.CurriculumModuleRepository;
import com.tempstaff.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/curriculum-modules")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
public class CurriculumModuleController {

    private final CurriculumModuleRepository curriculumModuleRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CurriculumModuleResponse>> list(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String programKind) {

        List<CurriculumModule> all = curriculumModuleRepository.findAll(
                Sort.by(Sort.Order.asc("academicLevel"), Sort.Order.asc("code")));

        List<CurriculumModuleResponse> filtered = all.stream()
                .filter(m -> semesterMatches(m.getSemesterLabel(), semester))
                .filter(m -> programKindMatches(m.getProgramKind(), programKind))
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @PostMapping
    public ResponseEntity<CurriculumModuleResponse> create(@Valid @RequestBody UpsertCurriculumModuleRequest req) {
        validateProgram(req);
        if (curriculumModuleRepository.existsByCodeIgnoreCase(req.getCode())) {
            throw new RuntimeException("Module code already exists");
        }
        CurriculumModule m = CurriculumModule.builder()
                .code(req.getCode().trim())
                .name(req.getName().trim())
                .academicLevel(req.getAcademicLevel())
                .semesterLabel(req.getSemesterLabel().trim())
                .credits(req.getCredits())
                .compulsoryOptional(req.getCompulsoryOptional().trim().toUpperCase())
                .chiefTutor(req.getChiefTutor() != null ? req.getChiefTutor().trim() : null)
                .programKind(req.getProgramKind().trim().toUpperCase())
                .mitTrack(normalizeMitTrack(req))
                .build();
        m = curriculumModuleRepository.save(m);
        return ResponseEntity.ok(toResponse(m));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CurriculumModuleResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpsertCurriculumModuleRequest req) {
        validateProgram(req);
        CurriculumModule m = curriculumModuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        if (curriculumModuleRepository.existsByCodeIgnoreCaseAndIdNot(req.getCode(), id)) {
            throw new RuntimeException("Module code already exists");
        }

        m.setCode(req.getCode().trim());
        m.setName(req.getName().trim());
        m.setAcademicLevel(req.getAcademicLevel());
        m.setSemesterLabel(req.getSemesterLabel().trim());
        m.setCredits(req.getCredits());
        m.setCompulsoryOptional(req.getCompulsoryOptional().trim().toUpperCase());
        m.setChiefTutor(req.getChiefTutor() != null ? req.getChiefTutor().trim() : null);
        m.setProgramKind(req.getProgramKind().trim().toUpperCase());
        m.setMitTrack(normalizeMitTrack(req));
        m = curriculumModuleRepository.save(m);
        return ResponseEntity.ok(toResponse(m));
    }

    @PostMapping("/notify")
    public ResponseEntity<Map<String, Object>> notifyStaff(@Valid @RequestBody NotifyCurriculumModulesRequest request) {
        List<CurriculumModule> modules = curriculumModuleRepository.findAllById(request.getModuleIds());
        if (modules.size() != request.getModuleIds().size()) {
            throw new RuntimeException("One or more module ids are invalid");
        }

        List<User> staff = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.staff));

        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", "Module notification queued (email delivery can be wired to your mail provider)");
        body.put("moduleCount", modules.size());
        body.put("staffNotified", staff.size());
        body.put("moduleCodes", modules.stream().map(CurriculumModule::getCode).collect(Collectors.toList()));

        return ResponseEntity.ok(body);
    }

    private static void validateProgram(UpsertCurriculumModuleRequest req) {
        String pk = req.getProgramKind().trim().toUpperCase();
        if (!"IT".equals(pk) && !"MIT".equals(pk) && !"ALL".equals(pk)) {
            throw new RuntimeException("programKind must be IT, MIT, or ALL");
        }
    }

    private static String normalizeMitTrack(UpsertCurriculumModuleRequest req) {
        if (!"MIT".equalsIgnoreCase(req.getProgramKind().trim())) {
            return null;
        }
        if (req.getMitTrack() == null || req.getMitTrack().isBlank()) {
            return null;
        }
        String t = req.getMitTrack().trim().toUpperCase();
        if (!"BSE".equals(t) && !"OSCM".equals(t) && !"IS".equals(t)) {
            throw new RuntimeException("mitTrack must be BSE, OSCM, or IS when set");
        }
        return t;
    }

    private static boolean semesterMatches(String label, String filter) {
        if (filter == null || filter.isBlank() || "all".equalsIgnoreCase(filter)) {
            return true;
        }
        String f = filter.trim();
        if ("1".equals(f)) {
            return "1".equals(label) || "1 & 2".equalsIgnoreCase(label) || label.startsWith("1 &");
        }
        if ("2".equals(f)) {
            return "2".equals(label) || "1 & 2".equalsIgnoreCase(label) || "1 OR 2".equalsIgnoreCase(label);
        }
        return label.equalsIgnoreCase(f);
    }

    /**
     * Programme filter semantics:
     * - all (or absent): IT + MIT + ALL (common)
     * - IT: IT-only rows
     * - MIT: MIT-only rows
     * - ALL: common rows (stored as program_kind = ALL, shown as MIT/IT in UI)
     */
    private static boolean programKindMatches(String kind, String filter) {
        if (filter == null || filter.isBlank() || "all".equalsIgnoreCase(filter)) {
            return true;
        }
        if (kind == null) {
            return false;
        }

        String k = kind.trim().toUpperCase();
        String f = filter.trim().toUpperCase();

        return switch (f) {
            case "IT" -> "IT".equals(k);
            case "MIT" -> "MIT".equals(k);
            case "ALL" -> "ALL".equals(k);
            default -> k.equals(f);
        };
    }

    private CurriculumModuleResponse toResponse(CurriculumModule m) {
        return CurriculumModuleResponse.builder()
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
                .build();
    }
}
