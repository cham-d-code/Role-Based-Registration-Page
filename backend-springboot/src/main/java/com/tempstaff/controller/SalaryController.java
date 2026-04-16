package com.tempstaff.controller;

import com.tempstaff.dto.request.ReviewSalaryReportRequest;
import com.tempstaff.dto.request.UpsertSalaryTemplateRequest;
import com.tempstaff.dto.response.SalaryReportResponse;
import com.tempstaff.dto.response.SalaryTemplateResponse;
import com.tempstaff.entity.User;
import com.tempstaff.service.SalaryService;
import com.tempstaff.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salary")
@RequiredArgsConstructor
public class SalaryController {

    private final SalaryService salaryService;
    private final UserRepository userRepository;

    private User currentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PutMapping("/templates")
    @PreAuthorize("hasRole('COORDINATOR')")
    public SalaryTemplateResponse upsertTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpsertSalaryTemplateRequest req
    ) {
        User me = currentUser(userDetails);
        return salaryService.upsertTemplate(me.getId(), req);
    }

    @GetMapping("/templates/{periodKey}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public SalaryTemplateResponse getTemplate(@PathVariable String periodKey) {
        return salaryService.getTemplate(periodKey)
                .orElseThrow(() -> new RuntimeException("Salary template not found"));
    }

    @PostMapping("/reports/generate/{periodKey}")
    @PreAuthorize("hasRole('COORDINATOR')")
    public List<SalaryReportResponse> generate(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String periodKey) {
        User me = currentUser(userDetails);
        return salaryService.generateReports(me.getId(), periodKey);
    }

    @GetMapping("/reports/{periodKey}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public List<SalaryReportResponse> list(@PathVariable String periodKey) {
        return salaryService.listReports(periodKey);
    }

    @PostMapping("/reports/{periodKey}/send-to-hod")
    @PreAuthorize("hasRole('COORDINATOR')")
    public void sendToHod(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String periodKey) {
        User me = currentUser(userDetails);
        salaryService.sendToHod(me.getId(), periodKey);
    }

    @PostMapping("/reports/{reportId}/approve")
    @PreAuthorize("hasRole('HOD')")
    public SalaryReportResponse approve(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID reportId,
            @Valid @RequestBody ReviewSalaryReportRequest body
    ) {
        User me = currentUser(userDetails);
        return salaryService.approve(me.getId(), reportId, body.getNote());
    }

    @PostMapping("/reports/{reportId}/reject")
    @PreAuthorize("hasRole('HOD')")
    public SalaryReportResponse reject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID reportId,
            @Valid @RequestBody ReviewSalaryReportRequest body
    ) {
        User me = currentUser(userDetails);
        return salaryService.reject(me.getId(), reportId, body.getNote());
    }
}

