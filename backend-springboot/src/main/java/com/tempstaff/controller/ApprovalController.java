package com.tempstaff.controller;

import com.tempstaff.dto.request.ApprovalRequest;
import com.tempstaff.dto.response.PendingUserResponse;
import com.tempstaff.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for handling user registration approvals
 * Accessible by HOD and Coordinator only
 */
@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
public class ApprovalController {

    private final ApprovalService approvalService;

    /**
     * GET /api/approvals/pending
     * Get all pending registrations (mentors and staff)
     */
    @GetMapping("/pending")
    public ResponseEntity<List<PendingUserResponse>> getPendingRegistrations() {
        try {
            List<PendingUserResponse> pendingUsers = approvalService.getPendingRegistrations();
            return ResponseEntity.ok(pendingUsers);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error fetching pending registrations: " + e.getMessage(), e);
        }
    }

    /**
     * GET /api/approvals/pending/mentors
     * Get pending mentor registrations only
     */
    @GetMapping("/pending/mentors")
    public ResponseEntity<List<PendingUserResponse>> getPendingMentors() {
        List<PendingUserResponse> pendingMentors = approvalService.getPendingMentors();
        return ResponseEntity.ok(pendingMentors);
    }

    /**
     * GET /api/approvals/pending/staff
     * Get pending staff registrations only
     */
    @GetMapping("/pending/staff")
    public ResponseEntity<List<PendingUserResponse>> getPendingStaff() {
        List<PendingUserResponse> pendingStaff = approvalService.getPendingStaff();
        return ResponseEntity.ok(pendingStaff);
    }

    /**
     * POST /api/approvals/approve/{userId}
     * Approve a user registration
     */
    @PostMapping("/approve/{userId}")
    public ResponseEntity<Map<String, Object>> approveUser(@PathVariable UUID userId) {
        try {
            approvalService.approveUser(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User approved successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * POST /api/approvals/reject/{userId}
     * Reject a user registration
     */
    @PostMapping("/reject/{userId}")
    public ResponseEntity<Map<String, Object>> rejectUser(
            @PathVariable UUID userId,
            @RequestBody(required = false) ApprovalRequest request) {
        try {
            String reason = request != null ? request.getRejectionReason() : null;
            approvalService.rejectUser(userId, reason);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User rejected successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
