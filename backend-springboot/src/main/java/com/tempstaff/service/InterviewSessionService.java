package com.tempstaff.service;

import com.tempstaff.dto.response.SessionStateResponse;
import com.tempstaff.entity.*;
import com.tempstaff.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepo;
    private final SessionParticipantRepository participantRepo;
    private final InterviewRepository interviewRepo;
    private final UserRepository userRepo;

    /**
     * Start a live interview session.
     * - Caller is added as 'active'
     * - If caller is coordinator: HODs are auto-approved (active), mentors go to waiting
     * - If caller is HOD: coordinators are auto-approved (active), mentors go to waiting
     */
    @Transactional
    public SessionStateResponse startSession(UUID interviewId, UUID callerId) {
        // End any existing active session for this interview
        sessionRepo.findByInterviewIdAndActiveTrue(interviewId).ifPresent(s -> {
            s.setActive(false);
            s.setEndedAt(LocalDateTime.now());
            sessionRepo.save(s);
        });

        Interview interview = interviewRepo.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        User caller = userRepo.findById(callerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        InterviewSession session = InterviewSession.builder()
                .interview(interview)
                .startedBy(caller)
                .build();
        session = sessionRepo.save(session);

        // Determine which roles to auto-approve vs put in waiting
        UserRole autoApproveRole = caller.getRole() == UserRole.coordinator
                ? UserRole.hod : UserRole.coordinator;

        // Fetch all approved panel members (HOD+mentor for coordinator, coordinator+mentor for HOD)
        List<UserRole> panelRoles = caller.getRole() == UserRole.coordinator
                ? Arrays.asList(UserRole.hod, UserRole.mentor)
                : Arrays.asList(UserRole.coordinator, UserRole.mentor);

        List<User> panelMembers = userRepo.findByStatusAndRoleIn(UserStatus.approved, panelRoles);

        // Add caller as active
        saveParticipant(session, caller, "active");

        // Add panel members
        for (User member : panelMembers) {
            if (member.getId().equals(callerId)) continue;
            String status = member.getRole() == autoApproveRole ? "active" : "waiting";
            saveParticipant(session, member, status);
        }

        return buildSessionState(session, callerId);
    }

    /** End the active session for an interview */
    @Transactional
    public void endSession(UUID interviewId) {
        sessionRepo.findByInterviewIdAndActiveTrue(interviewId).ifPresent(s -> {
            s.setActive(false);
            s.setEndedAt(LocalDateTime.now());
            sessionRepo.save(s);
        });
    }

    /** Get session state for a specific interview */
    @Transactional(readOnly = true)
    public SessionStateResponse getSessionState(UUID interviewId, UUID callerId) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session for this interview"));
        return buildSessionState(session, callerId);
    }

    /** Get any active session across all interviews (used for polling by mentor/HOD/coordinator) */
    @Transactional(readOnly = true)
    public SessionStateResponse getActiveSession(UUID callerId) {
        return sessionRepo.findFirstByActiveTrue()
                .map(s -> buildSessionState(s, callerId))
                .orElse(null);
    }

    /** Approve a waiting participant */
    @Transactional
    public void approveParticipant(UUID interviewId, UUID targetUserId) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session"));
        SessionParticipant p = participantRepo.findBySessionIdAndUserId(session.getId(), targetUserId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
        p.setStatus("active");
        participantRepo.save(p);
    }

    /**
     * Caller voluntarily leaves the session.
     * Their marks will still be kept but excluded from average calculations.
     */
    @Transactional
    public void leaveSession(UUID interviewId, UUID callerId) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session"));
        participantRepo.findBySessionIdAndUserId(session.getId(), callerId).ifPresent(p -> {
            p.setLeftSession(true);
            participantRepo.save(p);
        });
    }

    /** Remove an active participant back to waiting */
    @Transactional
    public void removeParticipant(UUID interviewId, UUID targetUserId) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session"));
        SessionParticipant p = participantRepo.findBySessionIdAndUserId(session.getId(), targetUserId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
        p.setStatus("removed");
        participantRepo.save(p);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void saveParticipant(InterviewSession session, User user, String status) {
        // Avoid duplicate
        participantRepo.findBySessionIdAndUserId(session.getId(), user.getId()).ifPresentOrElse(
                p -> { p.setStatus(status); participantRepo.save(p); },
                () -> participantRepo.save(SessionParticipant.builder()
                        .session(session).user(user).status(status).build())
        );
    }

    private SessionStateResponse buildSessionState(InterviewSession session, UUID callerId) {
        List<SessionParticipant> allParticipants = participantRepo.findBySessionId(session.getId());

        String myStatus = allParticipants.stream()
                .filter(p -> p.getUser().getId().equals(callerId))
                .map(SessionParticipant::getStatus)
                .findFirst().orElse(null);

        List<SessionStateResponse.ParticipantInfo> active = allParticipants.stream()
                .filter(p -> "active".equals(p.getStatus()))
                .map(p -> toInfo(p.getUser()))
                .collect(Collectors.toList());

        List<SessionStateResponse.ParticipantInfo> waiting = allParticipants.stream()
                .filter(p -> "waiting".equals(p.getStatus()))
                .map(p -> toInfo(p.getUser()))
                .collect(Collectors.toList());

        return SessionStateResponse.builder()
                .sessionId(session.getId().toString())
                .interviewId(session.getInterview().getId().toString())
                .interviewNumber(session.getInterview().getInterviewNumber())
                .startedAt(session.getStartedAt())
                .startedByName(session.getStartedBy() != null ? session.getStartedBy().getFullName() : null)
                .myStatus(myStatus)
                .activeParticipants(active)
                .waitingParticipants(waiting)
                .build();
    }

    private SessionStateResponse.ParticipantInfo toInfo(User u) {
        String[] parts = u.getFullName().trim().split("\\s+");
        String initials = Arrays.stream(parts).limit(2)
                .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                .collect(Collectors.joining());
        return SessionStateResponse.ParticipantInfo.builder()
                .userId(u.getId().toString())
                .fullName(u.getFullName())
                .role(u.getRole().name())
                .initials(initials)
                .build();
    }
}
