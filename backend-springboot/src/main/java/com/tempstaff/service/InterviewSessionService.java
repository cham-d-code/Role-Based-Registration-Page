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
    private final NotificationService notificationService;

    /**
     * Start a live interview session (Temporary Staff Coordinator only).
     * The coordinator is active; all other panel members (HOD, mentors, other coordinators) start in the waiting room
     * until the coordinator admits them.
     */
    @Transactional
    public SessionStateResponse startSession(UUID interviewId, UUID callerId) {
        User caller = userRepo.findById(callerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (caller.getRole() != UserRole.coordinator) {
            throw new RuntimeException("Only the Temporary Staff Coordinator can start an interview session.");
        }

        // Repair: rows still active while interview is already ended (should not block a new live session)
        for (InterviewSession stale : sessionRepo.findAllByActiveTrueAndInterview_Status(InterviewStatus.ended)) {
            stale.setActive(false);
            if (stale.getEndedAt() == null) {
                stale.setEndedAt(LocalDateTime.now());
            }
            sessionRepo.save(stale);
        }

        // End any existing active session for this interview
        sessionRepo.findByInterviewIdAndActiveTrue(interviewId).ifPresent(s -> {
            s.setActive(false);
            s.setEndedAt(LocalDateTime.now());
            sessionRepo.save(s);
        });

        Interview interview = interviewRepo.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        InterviewSession session = InterviewSession.builder()
                .interview(interview)
                .startedBy(caller)
                .build();
        session = sessionRepo.save(session);

        List<UserRole> panelRoles = Arrays.asList(UserRole.hod, UserRole.mentor, UserRole.coordinator);
        List<User> panelMembers = userRepo.findByStatusAndRoleIn(UserStatus.approved, panelRoles);

        saveParticipant(session, caller, "active");

        for (User member : panelMembers) {
            if (member.getId().equals(callerId)) {
                continue;
            }
            saveParticipant(session, member, "waiting");
        }

        List<User> hods = userRepo.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.hod));
        String startTitle = "Interview session started";
        String startMsg = String.format(
                "%s started the session for interview %s.",
                caller.getFullName(),
                interview.getInterviewNumber());
        for (User hod : hods) {
            if (hod.getId().equals(callerId)) continue;
            notificationService.notifyUser(
                    hod.getId(), startTitle, startMsg,
                    NotificationType.interview_started, null, null);
        }

        return buildSessionState(session, callerId);
    }

    /** End the active session for an interview (coordinator only). */
    @Transactional
    public void endSession(UUID interviewId, UUID callerId) {
        User caller = userRepo.findById(callerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (caller.getRole() != UserRole.coordinator) {
            throw new RuntimeException("Only the Temporary Staff Coordinator can end an interview session.");
        }
        sessionRepo.findByInterviewIdAndActiveTrue(interviewId).ifPresent(s -> {
            s.setActive(false);
            s.setEndedAt(LocalDateTime.now());
            sessionRepo.save(s);

            // Mark the interview as ended. HODs are notified only after the coordinator releases
            // the averaged report (see InterviewService.releaseInterviewReportToHod).
            Interview interview = s.getInterview();
            if (interview != null && interview.getStatus() != InterviewStatus.ended) {
                interview.setStatus(InterviewStatus.ended);
                interviewRepo.save(interview);
            }
        });
    }

    /** Get session state for a specific interview */
    @Transactional(readOnly = true)
    public SessionStateResponse getSessionState(UUID interviewId, UUID callerId) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session for this interview"));
        return buildSessionState(session, callerId);
    }

    /**
     * Get any active session across all interviews (used for polling by mentor/HOD/coordinator).
     * Only sessions for {@link InterviewStatus#upcoming} interviews count — avoids ghost "live" UI when
     * {@code is_active} was left true but the interview was already marked ended.
     */
    @Transactional(readOnly = true)
    public SessionStateResponse getActiveSession(UUID callerId) {
        return sessionRepo
                .findFirstByActiveTrueAndInterview_StatusOrderByStartedAtDesc(InterviewStatus.upcoming)
                .map(s -> buildSessionState(s, callerId))
                .orElse(null);
    }

    /** Approve a waiting participant (coordinator only). */
    @Transactional
    public void approveParticipant(UUID interviewId, UUID targetUserId, UUID callerId) {
        User caller = userRepo.findById(callerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (caller.getRole() != UserRole.coordinator) {
            throw new RuntimeException("Only the Temporary Staff Coordinator can admit participants.");
        }
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session"));
        SessionParticipant p = participantRepo.findBySessionIdAndUserId(session.getId(), targetUserId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
        p.setStatus("active");
        p.setLeftSession(false);
        participantRepo.save(p);
    }

    /**
     * Step off the active marking panel (waiting room). Marks are excluded from averages until
     * the participant is active again (e.g. coordinator uses Join again / Allow).
     */
    @Transactional
    public void leaveSession(UUID interviewId, UUID callerId) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session"));
        participantRepo.findBySessionIdAndUserId(session.getId(), callerId).ifPresent(p -> {
            p.setLeftSession(true);
            p.setStatus("waiting");
            participantRepo.save(p);
        });
    }

    /**
     * Move an active participant off the marking panel into the waiting room (coordinator only).
     * Same outcome as {@link #leaveSession} for the target user: they appear under waiting participants
     * and can be admitted again; marks stay excluded from averages until active again.
     */
    @Transactional
    public void removeParticipant(UUID interviewId, UUID targetUserId, UUID callerId) {
        User caller = userRepo.findById(callerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (caller.getRole() != UserRole.coordinator) {
            throw new RuntimeException("Only the Temporary Staff Coordinator can remove participants.");
        }
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new RuntimeException("No active session"));
        SessionParticipant p = participantRepo.findBySessionIdAndUserId(session.getId(), targetUserId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
        p.setStatus("waiting");
        p.setLeftSession(true);
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
