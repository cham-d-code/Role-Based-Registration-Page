package com.tempstaff.controller;

import com.tempstaff.dto.request.UpdateContractRequest;
import com.tempstaff.dto.response.UserProfileResponse;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.entity.UserSubject;
import com.tempstaff.repository.ModuleRepository;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.repository.UserSubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserSubjectRepository userSubjectRepository;
    private final ModuleRepository moduleRepository;

    /**
     * GET /api/user/me
     * Returns the currently authenticated user's profile details.
     * Requires a valid JWT Bearer token in the Authorization header.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfileResponse profile = UserProfileResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobile(user.getMobile())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .contractStartDate(user.getContractStartDate())
                .contractEndDate(user.getContractEndDate())
                .build();

        return ResponseEntity.ok(profile);
    }

    /**
     * GET /api/user/staff
     * Returns all approved temporary staff members.
     */
    @GetMapping("/staff")
    public ResponseEntity<List<UserProfileResponse>> getApprovedStaff() {

        List<User> staffUsers = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.staff));

        List<UserProfileResponse> response = staffUsers.stream()
                .map(u -> {
                    List<String> preferredSubjects = userSubjectRepository
                            .findByUserIdAndIsPreferred(u.getId(), true)
                            .stream()
                            .map(UserSubject::getModuleId)
                            .map(moduleId -> moduleRepository.findById(moduleId)
                                    .map(m -> m.getName())
                                    .orElse(null))
                            .filter(name -> name != null)
                            .collect(Collectors.toList());

                    return UserProfileResponse.builder()
                            .id(u.getId().toString())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .mobile(u.getMobile())
                            .contractStartDate(u.getContractStartDate())
                            .contractEndDate(u.getContractEndDate())
                            .preferredSubjects(preferredSubjects)
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/user/{userId}
     * Senior staff can view a user's profile (used for "View Profile" in applicants list).
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'MENTOR')")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable UUID userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> preferredSubjects = userSubjectRepository
                .findByUserIdAndIsPreferred(u.getId(), true)
                .stream()
                .map(UserSubject::getModuleId)
                .map(moduleId -> moduleRepository.findById(moduleId)
                        .map(m -> m.getName())
                        .orElse(null))
                .filter(name -> name != null)
                .collect(Collectors.toList());

        return ResponseEntity.ok(UserProfileResponse.builder()
                .id(u.getId().toString())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .mobile(u.getMobile())
                .role(u.getRole().name())
                .status(u.getStatus().name())
                .profileImageUrl(u.getProfileImageUrl())
                .createdAt(u.getCreatedAt())
                .contractStartDate(u.getContractStartDate())
                .contractEndDate(u.getContractEndDate())
                .preferredSubjects(preferredSubjects)
                .build());
    }

    /**
     * PUT /api/user/staff/{staffUserId}/contract
     * Update contract start/end dates for a staff member (Coordinator/HOD only)
     */
    @PutMapping("/staff/{staffUserId}/contract")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<UserProfileResponse> updateStaffContract(
            @PathVariable UUID staffUserId,
            @RequestBody UpdateContractRequest request
    ) {
        User staff = userRepository.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (staff.getRole() != UserRole.staff) {
            throw new RuntimeException("Only staff users can be updated");
        }

        if (request.getContractStartDate() == null || request.getContractEndDate() == null) {
            throw new RuntimeException("contractStartDate and contractEndDate are required");
        }

        if (request.getContractEndDate().isBefore(request.getContractStartDate())) {
            throw new RuntimeException("contractEndDate must be on or after contractStartDate");
        }

        staff.setContractStartDate(request.getContractStartDate());
        staff.setContractEndDate(request.getContractEndDate());
        userRepository.save(staff);

        return ResponseEntity.ok(
                UserProfileResponse.builder()
                        .id(staff.getId().toString())
                        .fullName(staff.getFullName())
                        .email(staff.getEmail())
                        .mobile(staff.getMobile())
                        .contractStartDate(staff.getContractStartDate())
                        .contractEndDate(staff.getContractEndDate())
                        .build()
        );
    }

    /**
     * GET /api/user/panel-members
     * Returns approved panel members for the interview waiting list.
     * - Coordinator calls → HODs + mentors (excludes coordinator)
     * - HOD calls → coordinators + mentors (excludes HOD)
     */
    @GetMapping("/panel-members")
    public ResponseEntity<List<UserProfileResponse>> getPanelMembers(
            @AuthenticationPrincipal UserDetails userDetails) {

        User caller = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserRole> panelRoles = caller.getRole() == UserRole.coordinator
                ? List.of(UserRole.hod, UserRole.mentor)
                : List.of(UserRole.coordinator, UserRole.mentor);

        List<User> members = userRepository.findByStatusAndRoleIn(UserStatus.approved, panelRoles);

        List<UserProfileResponse> response = members.stream()
                .filter(u -> !u.getId().equals(caller.getId()))
                .map(u -> UserProfileResponse.builder()
                        .id(u.getId().toString())
                        .fullName(u.getFullName())
                        .role(u.getRole().name())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
