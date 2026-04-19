package com.tempstaff.controller;

import com.tempstaff.dto.response.SessionStateResponse;
import com.tempstaff.entity.User;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.InterviewSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewSessionController {

    private final InterviewSessionService sessionService;
    private final UserRepository userRepository;

    /** Start a live session for an interview */
    @PostMapping("/{interviewId}/session/start")
    public ResponseEntity<SessionStateResponse> startSession(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        return ResponseEntity.ok(sessionService.startSession(interviewId, caller.getId()));
    }

    /** End the active session (coordinator only) */
    @DeleteMapping("/{interviewId}/session")
    public ResponseEntity<Void> endSession(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        sessionService.endSession(interviewId, caller.getId());
        return ResponseEntity.ok().build();
    }

    /** Get current session state (for coordinator/HOD panel management) */
    @GetMapping("/{interviewId}/session")
    public ResponseEntity<SessionStateResponse> getSession(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        return ResponseEntity.ok(sessionService.getSessionState(interviewId, caller.getId()));
    }

    /** Approve a waiting participant (coordinator only) */
    @PutMapping("/{interviewId}/session/approve/{userId}")
    public ResponseEntity<Void> approve(
            @PathVariable UUID interviewId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        sessionService.approveParticipant(interviewId, userId, caller.getId());
        return ResponseEntity.ok().build();
    }

    /** Remove an active participant (coordinator only) */
    @PutMapping("/{interviewId}/session/remove/{userId}")
    public ResponseEntity<Void> remove(
            @PathVariable UUID interviewId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        sessionService.removeParticipant(interviewId, userId, caller.getId());
        return ResponseEntity.ok().build();
    }

    /** Step off the active panel into waiting (marks excluded from averages until readmitted active) */
    @PutMapping("/{interviewId}/session/leave")
    public ResponseEntity<Void> leaveSession(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        sessionService.leaveSession(interviewId, caller.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Get any currently active session + my status (used for polling by all roles).
     * Returns 204 No Content if no session is active.
     */
    @GetMapping("/active-session")
    public ResponseEntity<SessionStateResponse> getActiveSession(
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        SessionStateResponse state = sessionService.getActiveSession(caller.getId());
        return state != null ? ResponseEntity.ok(state) : ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
