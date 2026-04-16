package com.tempstaff.controller;

import com.tempstaff.dto.request.UpsertJobDescriptionRequest;
import com.tempstaff.dto.response.JobDescriptionResponse;
import com.tempstaff.entity.User;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.JobDescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/job-descriptions")
@RequiredArgsConstructor
public class JobDescriptionController {

    private final JobDescriptionService jobDescriptionService;
    private final UserRepository userRepository;

    private User currentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PutMapping("/staff/{staffId}")
    @PreAuthorize("hasAnyRole('COORDINATOR','HOD')")
    public ResponseEntity<JobDescriptionResponse> upsertForStaff(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID staffId,
            @Valid @RequestBody UpsertJobDescriptionRequest req
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(jobDescriptionService.upsertForStaff(me.getId(), staffId, req));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<JobDescriptionResponse> getMine(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User me = currentUser(userDetails);
        return ResponseEntity.ok(jobDescriptionService.getMine(me.getId()));
    }

    @GetMapping("/staff/{staffId}")
    @PreAuthorize("hasAnyRole('MENTOR','COORDINATOR','HOD')")
    public ResponseEntity<JobDescriptionResponse> getForStaff(
            @PathVariable UUID staffId
    ) {
        return ResponseEntity.ok(jobDescriptionService.getForStaff(staffId));
    }
}

