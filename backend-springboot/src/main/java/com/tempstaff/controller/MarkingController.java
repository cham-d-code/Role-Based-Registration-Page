package com.tempstaff.controller;

import com.tempstaff.dto.request.SaveMarkingSchemeRequest;
import com.tempstaff.dto.request.SubmitMarksRequest;
import com.tempstaff.dto.response.InterviewReportResponse;
import com.tempstaff.dto.response.MarkingSchemeResponse;
import com.tempstaff.entity.User;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.MarkingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class MarkingController {

    private final MarkingService markingService;
    private final UserRepository userRepository;

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

    /** HOD gets the full interview report */
    @GetMapping("/{interviewId}/report")
    public ResponseEntity<InterviewReportResponse> getReport(@PathVariable UUID interviewId) {
        return ResponseEntity.ok(markingService.getReport(interviewId));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
