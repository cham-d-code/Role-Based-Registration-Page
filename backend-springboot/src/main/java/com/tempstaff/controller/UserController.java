package com.tempstaff.controller;

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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
