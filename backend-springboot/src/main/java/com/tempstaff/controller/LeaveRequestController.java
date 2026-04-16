package com.tempstaff.controller;

import com.tempstaff.dto.request.ApplyLeaveRequest;
import com.tempstaff.dto.response.LeaveRequestResponse;
import com.tempstaff.entity.LeaveRequest;
import com.tempstaff.entity.RequestStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.repository.LeaveRequestRepository;
import com.tempstaff.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    private User currentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/apply")
    @PreAuthorize("hasRole('STAFF')")
    public LeaveRequestResponse apply(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ApplyLeaveRequest request
    ) {
        User me = currentUser(userDetails);
        if (me.getRole() != UserRole.staff) {
            throw new RuntimeException("Only staff can apply for leave");
        }
        if (request.getLeaveDate() == null) throw new RuntimeException("leaveDate is required");
        if (request.getReason() == null || request.getReason().isBlank()) throw new RuntimeException("reason is required");
        if (request.getSubstituteId() == null) throw new RuntimeException("substituteId is required");

        User substitute = userRepository.findById(request.getSubstituteId())
                .orElseThrow(() -> new RuntimeException("Substitute staff not found"));
        if (substitute.getRole() != UserRole.staff) {
            throw new RuntimeException("substituteId must belong to staff");
        }
        if (substitute.getStatus() != com.tempstaff.entity.UserStatus.approved) {
            throw new RuntimeException("substitute staff must be approved");
        }

        LeaveRequest lr = LeaveRequest.builder()
                .user(me)
                .leaveType("other")
                .substitute(substitute)
                .startDate(request.getLeaveDate())
                .endDate(request.getLeaveDate())
                .reason(request.getReason().trim())
                .status(RequestStatus.pending)
                .rejectionReason(null)
                .build();

        lr = leaveRequestRepository.save(lr);

        return toResponse(lr);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STAFF')")
    public List<LeaveRequestResponse> mine(@AuthenticationPrincipal UserDetails userDetails) {
        User me = currentUser(userDetails);
        return leaveRequestRepository.findByUser_Id(me.getId())
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public List<LeaveRequestResponse> pending() {
        return leaveRequestRepository.findByStatus(RequestStatus.pending)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public LeaveRequestResponse approve(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User approver = currentUser(userDetails);
        LeaveRequest lr = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (lr.getStatus() != RequestStatus.pending) {
            return toResponse(lr);
        }

        lr.setStatus(RequestStatus.approved);
        lr.setApprovedBy(approver);
        lr.setApprovedAt(LocalDateTime.now());
        lr.setRejectionReason(null);

        lr = leaveRequestRepository.save(lr);
        return toResponse(lr);
    }

    public static class RejectBody {
        public String rejectionReason;
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HOD', 'COORDINATOR')")
    public LeaveRequestResponse reject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody(required = false) RejectBody body
    ) {
        User approver = currentUser(userDetails);
        LeaveRequest lr = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (lr.getStatus() != RequestStatus.pending) {
            return toResponse(lr);
        }

        lr.setStatus(RequestStatus.rejected);
        lr.setApprovedBy(approver);
        lr.setApprovedAt(LocalDateTime.now());
        lr.setRejectionReason(body == null ? null : body.rejectionReason);

        lr = leaveRequestRepository.save(lr);
        return toResponse(lr);
    }

    private LeaveRequestResponse toResponse(LeaveRequest lr) {
        UUID substituteId = lr.getSubstitute() != null ? lr.getSubstitute().getId() : null;
        String substituteName = lr.getSubstitute() != null ? lr.getSubstitute().getFullName() : null;
        UUID approvedById = lr.getApprovedBy() != null ? lr.getApprovedBy().getId() : null;
        String approvedByName = lr.getApprovedBy() != null ? lr.getApprovedBy().getFullName() : null;

        LocalDate leaveDate = lr.getStartDate() != null ? lr.getStartDate() : null;

        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .staffId(lr.getUser() != null ? lr.getUser().getId() : null)
                .staffName(lr.getUser() != null ? lr.getUser().getFullName() : null)
                .staffEmail(lr.getUser() != null ? lr.getUser().getEmail() : null)
                .leaveDate(leaveDate)
                .reason(lr.getReason())
                .substituteId(substituteId)
                .substituteName(substituteName)
                .status(lr.getStatus())
                .submittedAt(lr.getCreatedAt())
                .approvedById(approvedById)
                .approvedByName(approvedByName)
                .approvedAt(lr.getApprovedAt())
                .rejectionReason(lr.getRejectionReason())
                .build();
    }
}

