package com.tempstaff.controller;

import com.tempstaff.dto.request.AssignMentorRequest;
import com.tempstaff.dto.request.UpdateContractRequest;
import com.tempstaff.dto.request.UpdateMyProfileRequest;
import com.tempstaff.dto.request.UpdateSpecializationRequest;
import com.tempstaff.service.ImStaffDirectoryService;
import com.tempstaff.service.NotificationService;
import com.tempstaff.service.ModulePreferenceService;
import com.tempstaff.dto.response.UserProfileResponse;
import com.tempstaff.entity.NotificationType;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserSubjectRepository userSubjectRepository;
    private final ModuleRepository moduleRepository;
    private final ImStaffDirectoryService imStaffDirectoryService;
    private final NotificationService notificationService;
    private final ModulePreferenceService modulePreferenceService;
    private final PasswordEncoder passwordEncoder;

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

        // Best-effort enrichment for senior academic staff if specialization is missing.
        if ((user.getSpecialization() == null || user.getSpecialization().isBlank())
                && user.getEmail() != null
                && user.getEmail().toLowerCase().endsWith("@kln.ac.lk")
                && user.getRole() != null
                && user.getRole() != UserRole.staff) {
            String specialization = imStaffDirectoryService.lookupSpecializationByFullName(user.getFullName());
            if (specialization != null && !specialization.isBlank()) {
                user.setSpecialization(specialization);
                userRepository.save(user);
            }
        }

        List<String> preferredSubjects = userSubjectRepository
                .findByUserIdAndIsPreferred(user.getId(), true)
                .stream()
                .map(UserSubject::getModuleId)
                .map(moduleId -> moduleRepository.findById(moduleId)
                        .map(m -> m.getName())
                        .orElse(null))
                .filter(name -> name != null)
                .collect(Collectors.toList());
        if (preferredSubjects.isEmpty() && user.getSpecialization() != null && !user.getSpecialization().isBlank()) {
            preferredSubjects = List.of(user.getSpecialization().split("\\s*,\\s*"));
        }

        UserProfileResponse profile = UserProfileResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobile(user.getMobile())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .profileImageUrl(user.getProfileImageUrl())
                .specialization(user.getSpecialization())
                .createdAt(user.getCreatedAt())
                .contractStartDate(user.getContractStartDate())
                .contractEndDate(user.getContractEndDate())
                .preferredSubjects(preferredSubjects)
                .build();

        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/user/me/profile
     * Update basic profile fields (all roles) + optionally change password.
     *
     * - Email cannot be changed here.
     * - If newPassword is provided, currentPassword must be provided and valid.
     */
    @PutMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateMyProfileRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fullName = request != null ? request.getFullName() : null;
        if (fullName != null) fullName = fullName.trim();
        if (fullName != null && fullName.isBlank()) fullName = null;

        String mobile = request != null ? request.getMobile() : null;
        if (mobile != null) mobile = mobile.trim();
        if (mobile != null && mobile.isBlank()) mobile = null;

        String profileImageUrl = request != null ? request.getProfileImageUrl() : null;
        if (profileImageUrl != null) profileImageUrl = profileImageUrl.trim();
        if (profileImageUrl != null && profileImageUrl.isBlank()) profileImageUrl = null;

        String currentPassword = request != null ? request.getCurrentPassword() : null;
        String newPassword = request != null ? request.getNewPassword() : null;
        if (newPassword != null) newPassword = newPassword.trim();
        if (newPassword != null && newPassword.isBlank()) newPassword = null;

        if (newPassword != null) {
            if (currentPassword == null || currentPassword.isBlank()) {
                throw new RuntimeException("currentPassword is required to change password");
            }
            if (newPassword.length() < 8) {
                throw new RuntimeException("newPassword must be at least 8 characters");
            }
            if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        if (fullName != null) user.setFullName(fullName);
        if (mobile != null) user.setMobile(mobile);
        user.setProfileImageUrl(profileImageUrl);

        userRepository.save(user);
        return getMyProfile(userDetails);
    }

    /**
     * GET /api/user/staff
     * Returns all approved temporary staff members.
     */
    @GetMapping("/staff")
    public ResponseEntity<List<UserProfileResponse>> getApprovedStaff() {

        List<User> staffUsers = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.staff));

        List<UUID> staffIds = staffUsers.stream().map(User::getId).collect(Collectors.toList());
        var preferredModulesByStaff = modulePreferenceService.getLatestPreferredModuleCodesForStaff(staffIds);
        var preferredModuleDetailsByStaff = modulePreferenceService.getLatestPreferredModulesForStaff(staffIds);
        var missingSubmission = modulePreferenceService.staffMissingSubmissionForLatestRequest(staffIds);
        var submittedPrefs = modulePreferenceService.staffSubmittedForLatestRequest(staffIds);

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
                    if (preferredSubjects.isEmpty() && u.getSpecialization() != null && !u.getSpecialization().isBlank()) {
                        preferredSubjects = List.of(u.getSpecialization().split("\\s*,\\s*"));
                    }

                    String mentorId = u.getMentorId() != null ? u.getMentorId().toString() : null;
                    String mentorName = null;
                    if (u.getMentorId() != null) {
                        mentorName = userRepository.findById(u.getMentorId())
                                .map(User::getFullName)
                                .orElse(null);
                    }

                    return UserProfileResponse.builder()
                            .id(u.getId().toString())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .mobile(u.getMobile())
                            .specialization(u.getSpecialization())
                            .contractStartDate(u.getContractStartDate())
                            .contractEndDate(u.getContractEndDate())
                            .preferredSubjects(preferredSubjects)
                            .mentorId(mentorId)
                            .mentorName(mentorName)
                            .preferredModules(preferredModulesByStaff.get(u.getId()))
                            .preferredModuleDetails(preferredModuleDetailsByStaff.get(u.getId()))
                            .preferencesRequested(missingSubmission.contains(u.getId()))
                            .modulePreferencesSubmitted(submittedPrefs.contains(u.getId()))
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/user/me/preferred-subjects
     * Temporary staff can update their preferred subjects (used when initial module matching failed).
     */
    @PutMapping("/me/preferred-subjects")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<UserProfileResponse> updateMyPreferredSubjects(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody com.tempstaff.dto.request.UpdatePreferredSubjectsRequest request) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> desired = (request == null || request.getPreferredSubjects() == null)
                ? List.of()
                : request.getPreferredSubjects().stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());

        userSubjectRepository.deleteByUserIdAndIsPreferred(user.getId(), true);

        for (String subjectName : desired) {
            List<com.tempstaff.entity.Module> modules = moduleRepository.findByNameContainingIgnoreCase(subjectName);
            com.tempstaff.entity.Module moduleToUse;
            if (!modules.isEmpty()) {
                moduleToUse = modules.get(0);
            } else {
                moduleToUse = moduleRepository.save(com.tempstaff.entity.Module.builder()
                        .code("USR-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .name(subjectName)
                        .department("Industrial Management")
                        .credits(3)
                        .isActive(true)
                        .build());
            }

            userSubjectRepository.save(UserSubject.builder()
                    .userId(user.getId())
                    .moduleId(moduleToUse.getId())
                    .isPreferred(true)
                    .build());
        }

        String raw = String.join(", ", desired);
        user.setSpecialization(raw.isBlank() ? null : raw);
        userRepository.save(user);

        return getMyProfile(userDetails);
    }

    /**
     * PUT /api/user/me/specialization
     * Senior academic staff (mentor/coordinator/hod) can update their specialization areas (comma-separated text).
     */
    @PutMapping("/me/specialization")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR', 'MENTOR')")
    public ResponseEntity<UserProfileResponse> updateMySpecialization(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateSpecializationRequest request) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String specialization = request != null ? request.getSpecialization() : null;
        if (specialization != null) specialization = specialization.trim();
        if (specialization != null && specialization.isBlank()) specialization = null;

        user.setSpecialization(specialization);
        userRepository.save(user);

        return getMyProfile(userDetails);
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
                .specialization(u.getSpecialization())
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

    /**
     * GET /api/user/mentors
     * Returns approved mentor candidates (Mentor/HOD/Coordinator) with specialization (for mentor assignment).
     */
    @GetMapping("/mentors")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<List<UserProfileResponse>> getApprovedMentors() {
        List<User> mentors = userRepository.findByStatusAndRoleIn(
                UserStatus.approved,
                List.of(UserRole.mentor, UserRole.hod, UserRole.coordinator)
        );
        List<UserProfileResponse> response = mentors.stream()
                .map(u -> UserProfileResponse.builder()
                        .id(u.getId().toString())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .mobile(u.getMobile())
                        .role(u.getRole().name())
                        .status(u.getStatus().name())
                        .profileImageUrl(u.getProfileImageUrl())
                        .specialization(u.getSpecialization())
                        .createdAt(u.getCreatedAt())
                        .menteesCount((int) userRepository.countByStatusAndRoleAndMentorId(UserStatus.approved, UserRole.staff, u.getId()))
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/user/staff/{staffUserId}/mentor
     * Assign a mentor to a staff member (HOD/Coordinator).
     */
    @PutMapping("/staff/{staffUserId}/mentor")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public ResponseEntity<Map<String, Object>> assignMentor(
            @PathVariable UUID staffUserId,
            @RequestBody AssignMentorRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (request == null || request.getMentorId() == null) {
            throw new RuntimeException("mentorId is required");
        }

        User assigner = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        User staff = userRepository.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));
        if (staff.getRole() != UserRole.staff) {
            throw new RuntimeException("Only staff users can be assigned a mentor");
        }

        User mentor = userRepository.findById(request.getMentorId())
                .orElseThrow(() -> new RuntimeException("Mentor user not found"));
        if (!(mentor.getRole() == UserRole.mentor || mentor.getRole() == UserRole.hod || mentor.getRole() == UserRole.coordinator)) {
            throw new RuntimeException("mentorId must belong to a mentor / HOD / coordinator user");
        }

        staff.setMentorId(mentor.getId());
        userRepository.save(staff);

        // Notify staff + mentor
        notificationService.notifyUser(
                staff.getId(),
                "Mentor assigned",
                String.format("You have been assigned a mentor: %s.", mentor.getFullName()),
                NotificationType.mentor_assigned,
                null,
                null
        );
        notificationService.notifyUser(
                mentor.getId(),
                "New mentee assigned",
                String.format("%s assigned %s as your mentee.", assigner.getFullName(), staff.getFullName()),
                NotificationType.mentor_assigned,
                null,
                null
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Mentor assigned",
                "mentorId", mentor.getId().toString(),
                "mentorName", mentor.getFullName()
        ));
    }

    /**
     * GET /api/user/mentees/mine
     * List my mentees (approved staff assigned to me).
     * Allowed for mentors and management users (if they act as mentors).
     */
    @GetMapping("/mentees/mine")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<List<UserProfileResponse>> getMyMentees(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> mentees = userRepository.findByStatusAndRoleAndMentorId(UserStatus.approved, UserRole.staff, me.getId());

        List<UserProfileResponse> response = mentees.stream()
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
                    if (preferredSubjects.isEmpty() && u.getSpecialization() != null && !u.getSpecialization().isBlank()) {
                        preferredSubjects = List.of(u.getSpecialization().split("\\s*,\\s*"));
                    }

                    return UserProfileResponse.builder()
                            .id(u.getId().toString())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .mobile(u.getMobile())
                            .role(u.getRole().name())
                            .status(u.getStatus().name())
                            .profileImageUrl(u.getProfileImageUrl())
                            .specialization(u.getSpecialization())
                            .createdAt(u.getCreatedAt())
                            .contractStartDate(u.getContractStartDate())
                            .contractEndDate(u.getContractEndDate())
                            .preferredSubjects(preferredSubjects)
                            .mentorId(u.getMentorId() != null ? u.getMentorId().toString() : null)
                            .mentorName(me.getFullName())
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/user/mentees/mine/count
     * Returns the count of approved staff assigned to me.
     */
    @GetMapping("/mentees/mine/count")
    @PreAuthorize("hasAnyRole('HOD','COORDINATOR','MENTOR')")
    public ResponseEntity<Map<String, Object>> getMyMenteesCount(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        long count = userRepository.countByStatusAndRoleAndMentorId(UserStatus.approved, UserRole.staff, me.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
