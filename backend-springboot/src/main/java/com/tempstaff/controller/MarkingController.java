package com.tempstaff.controller;

import com.tempstaff.dto.request.SaveMarkingSchemeRequest;
import com.tempstaff.dto.request.SubmitMarksRequest;
import com.tempstaff.dto.response.InterviewReportResponse;
import com.tempstaff.dto.response.InterviewResponse;
import com.tempstaff.dto.response.MarkingSchemeResponse;
import com.tempstaff.entity.Interview;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.repository.InterviewRepository;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.InterviewService;
import com.tempstaff.service.MarkingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class MarkingController {

    private final MarkingService markingService;
    private final InterviewService interviewService;
    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;

    /** Coordinator creates/replaces the marking scheme for an interview */
    @PostMapping("/{interviewId}/marking-scheme")
    public ResponseEntity<MarkingSchemeResponse> saveScheme(
            @PathVariable UUID interviewId,
            @RequestBody SaveMarkingSchemeRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        User caller = getUser(userDetails);
        return ResponseEntity.ok(markingService.saveScheme(interviewId, caller.getId(), req));
    }

    /** Get the marking scheme for an interview (any panel member) */
    @GetMapping("/{interviewId}/marking-scheme")
    public ResponseEntity<MarkingSchemeResponse> getScheme(@PathVariable UUID interviewId) {
        return markingService.getScheme(interviewId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** Panel member submits marks for a candidate */
    @PostMapping("/{interviewId}/marks/{candidateId}")
    public ResponseEntity<Void> submitMarks(
            @PathVariable UUID interviewId,
            @PathVariable UUID candidateId,
            @RequestBody SubmitMarksRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        User caller = getUser(userDetails);
        markingService.submitMarks(interviewId, candidateId, caller.getId(), req);
        return ResponseEntity.ok().build();
    }

    /**
     * Averaged marking report: coordinator anytime after the interview; HOD only after coordinator release.
     */
    @GetMapping("/{interviewId}/report")
    public ResponseEntity<InterviewReportResponse> getReport(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User caller = getUser(userDetails);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        if (caller.getRole() == UserRole.hod) {
            if (interview.getReportSentToHodAt() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "The coordinator has not released this report for HOD review yet.");
            }
        } else if (caller.getRole() != UserRole.coordinator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this report.");
        }
        return ResponseEntity.ok(markingService.getReport(interviewId));
    }

    /**
     * Coordinator releases averaged results to HOD (ended interview only).
     * Implemented here next to {@link #getReport} so the route is always registered with interview marking APIs.
     * POST (in addition to legacy PUT on {@link InterviewController}) avoids some proxies blocking PUT.
     */
    @PostMapping("/{interviewId}/report/release")
    public ResponseEntity<InterviewResponse> releaseReportToHodPost(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = getUser(userDetails);
        try {
            return ResponseEntity.ok(interviewService.releaseInterviewReportToHod(interviewId, caller.getId()));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
