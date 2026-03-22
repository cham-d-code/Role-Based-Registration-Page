package com.tempstaff.service;

import com.tempstaff.dto.response.PendingUserResponse;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling user registration approvals
 * Used by HOD and Coordinator to approve/reject mentor and staff registrations
 */
@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final UserRepository userRepository;

    /**
     * Get all pending registrations (mentors and staff only)
     */
    public List<PendingUserResponse> getPendingRegistrations() {
        List<UserRole> approvableRoles = Arrays.asList(UserRole.mentor, UserRole.staff);
        List<User> pendingUsers = userRepository.findByStatusAndRoleIn(UserStatus.pending, approvableRoles);
        return pendingUsers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get pending mentors only
     */
    public List<PendingUserResponse> getPendingMentors() {
        List<User> pendingMentors = userRepository.findByStatusAndRole(UserStatus.pending, UserRole.mentor);
        return pendingMentors.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get pending staff only
     */
    public List<PendingUserResponse> getPendingStaff() {
        List<User> pendingStaff = userRepository.findByStatusAndRole(UserStatus.pending, UserRole.staff);
        return pendingStaff.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approve a user registration
     */
    @Transactional
    public void approveUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Only allow approving pending mentor/staff
        if (user.getRole() != UserRole.mentor && user.getRole() != UserRole.staff) {
            throw new RuntimeException("Can only approve mentor or staff registrations");
        }

        if (user.getStatus() != UserStatus.pending) {
            throw new RuntimeException("User is not in pending status");
        }

        userRepository.updateStatus(userId, UserStatus.approved);
    }

    /**
     * Reject a user registration
     */
    @Transactional
    public void rejectUser(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Only allow rejecting pending mentor/staff
        if (user.getRole() != UserRole.mentor && user.getRole() != UserRole.staff) {
            throw new RuntimeException("Can only reject mentor or staff registrations");
        }

        if (user.getStatus() != UserStatus.pending) {
            throw new RuntimeException("User is not in pending status");
        }

        userRepository.updateStatus(userId, UserStatus.rejected);
    }

    /**
     * Map User entity to PendingUserResponse DTO
     */
    private PendingUserResponse mapToResponse(User user) {
        return PendingUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobile(user.getMobile())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
