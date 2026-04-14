package com.tempstaff.controller;

import com.tempstaff.dto.request.CreateResearchOpportunityRequest;
import com.tempstaff.dto.request.UpdateResearchOpportunityRequest;
import com.tempstaff.dto.response.ResearchApplicantResponse;
import com.tempstaff.dto.response.ResearchApplicationResponse;
import com.tempstaff.dto.response.ResearchOpportunityResponse;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.ResearchOpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/research")
@RequiredArgsConstructor
public class ResearchOpportunityController {

    private final ResearchOpportunityService researchOpportunityService;
    private final UserRepository userRepository;

    private User currentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Senior staff dashboard
    @PostMapping("/opportunities")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<ResearchOpportunityResponse> createOpportunity(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateResearchOpportunityRequest request
    ) {
        User me = currentUser(userDetails);
        ResearchOpportunityResponse created = researchOpportunityService.createOpportunity(me.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/opportunities/mine")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<List<ResearchOpportunityResponse>> listMyOpportunities(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(researchOpportunityService.listMyOpportunities(me.getId()));
    }

    @PutMapping("/opportunities/{opportunityId}")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<ResearchOpportunityResponse> updateOpportunity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID opportunityId,
            @RequestBody UpdateResearchOpportunityRequest request
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(researchOpportunityService.updateOpportunity(me.getId(), opportunityId, request));
    }

    @DeleteMapping("/opportunities/{opportunityId}")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<Map<String, Object>> deleteOpportunity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID opportunityId
    ) {
        User me = currentUser(userDetails);
        researchOpportunityService.deleteOpportunity(me.getId(), opportunityId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Opportunity deleted"));
    }

    @GetMapping("/opportunities/{opportunityId}/applications")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<List<ResearchApplicantResponse>> listApplicants(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID opportunityId
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(researchOpportunityService.listApplicants(me.getId(), opportunityId));
    }

    @PostMapping("/applications/{applicationId}/accept")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<ResearchApplicantResponse> acceptApplicant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID applicationId
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(researchOpportunityService.acceptApplicant(me.getId(), applicationId));
    }

    @PostMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<ResearchApplicantResponse> rejectApplicant(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID applicationId
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(researchOpportunityService.rejectApplicant(me.getId(), applicationId));
    }

    // Temp staff dashboard
    @GetMapping("/opportunities")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<ResearchOpportunityResponse>> listOpenOpportunities(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Just to enforce auth/role; we don't use user id here
        User me = currentUser(userDetails);
        if (me.getRole() != UserRole.staff) {
            throw new RuntimeException("Only staff can view open opportunities");
        }
        return ResponseEntity.ok(researchOpportunityService.listOpenOpportunitiesForStaff());
    }

    @PostMapping("/opportunities/{opportunityId}/apply")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ResearchApplicationResponse> apply(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID opportunityId
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(researchOpportunityService.apply(me.getId(), opportunityId));
    }

    @GetMapping("/applications/mine")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<ResearchApplicationResponse>> listMyApplications(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(researchOpportunityService.listMyApplications(me.getId()));
    }
}

