package com.tempstaff.controller;

import com.tempstaff.dto.request.SubmitModulePreferencesRequest;
import com.tempstaff.dto.response.ModulePreferenceRequestResponse;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.ModulePreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/module-preferences")
@RequiredArgsConstructor
public class ModulePreferenceController {

    private final ModulePreferenceService modulePreferenceService;
    private final UserRepository userRepository;

    private User currentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/latest")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ModulePreferenceRequestResponse> latestForStaff(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User me = currentUser(userDetails);
        if (me.getRole() != UserRole.staff) {
            throw new RuntimeException("Only staff can view module preference requests");
        }
        return modulePreferenceService.getLatestRequestForStaff(me.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(null));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> submit(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SubmitModulePreferencesRequest request
    ) {
        User me = currentUser(userDetails);
        modulePreferenceService.submit(me.getId(), request);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }
}

