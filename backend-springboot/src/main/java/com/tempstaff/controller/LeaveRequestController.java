package com.tempstaff.controller;

import com.tempstaff.dto.request.ApplyLeaveRequest;
import com.tempstaff.dto.response.LeaveRequestResponse;
import com.tempstaff.entity.LeaveRequest;
import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.RequestStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.repository.LeaveRequestRepository;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only staff can apply for leave");
        }
        if (request.getLeaveDate() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "leaveDate is required");
        if (request.getReason() == null || request.getReason().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required");
        if (request.getSubstituteId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "substituteId is required");

        leaveRequestRepository.findFirstByUser_IdAndStartDateAndStatusInOrderByCreatedAtDesc(
                me.getId(),
                request.getLeaveDate(),
                Arrays.asList(RequestStatus.pending, RequestStatus.approved)
        ).ifPresent(existing -> {
            if (existing.getStatus() == RequestStatus.pending) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already applied for that day.");
            }
            if (existing.getStatus() == RequestStatus.approved) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your leave request for that day is already accepted.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already have a leave request for this date.");
        });

        User substitute = userRepository.findById(request.getSubstituteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Substitute staff not found"));
        if (substitute.getRole() != UserRole.staff) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "substituteId must belong to staff");
        }
        if (substitute.getStatus() != com.tempstaff.entity.UserStatus.approved) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "substitute staff must be approved");
        }

        boolean substituteAlreadyChosenForDay = leaveRequestRepository.existsBySubstitute_IdAndStartDateAndStatusIn(
                substitute.getId(),
                request.getLeaveDate(),
                Arrays.asList(RequestStatus.pending, RequestStatus.approved)
        );
        if (substituteAlreadyChosenForDay) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This substitute is already assigned for a leave request on that day. Please choose another substitute."
            );
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

        // Notify HOD + Coordinator that a leave request was received
        List<User> management = userRepository.findByStatusAndRoleIn(
                com.tempstaff.entity.UserStatus.approved, List.of(UserRole.hod, UserRole.coordinator));
        String title = "Leave request received";
        String msg = String.format(
                "%s submitted a leave request for %s. Substitute: %s. [leaveRequestId=%s, staffId=%s]",
                me.getFullName(),
                request.getLeaveDate(),
                substitute.getFullName(),
                lr.getId(),
                me.getId()
        );
        for (User m : management) {
            notificationService.notifyUser(m.getId(), title, msg, NotificationType.leave_request, null, null);
        }

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

        // Notify staff about decision (shows in staff notifications + sidebar badge until viewed)
        notificationService.notifyUser(
                lr.getUser().getId(),
                "Leave request approved",
                "Your leave request for " + lr.getStartDate() + " was approved.",
                NotificationType.leave_approved,
                null,
                null
        );
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

        String reason = body == null ? null : body.rejectionReason;
        String msg = "Your leave request for " + lr.getStartDate() + " was rejected." + (reason != null && !reason.isBlank() ? " Reason: " + reason : "");
        notificationService.notifyUser(
                lr.getUser().getId(),
                "Leave request rejected",
                msg,
                NotificationType.leave_rejected,
                null,
                null
        );
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

