package com.tempstaff.controller;

import com.tempstaff.dto.response.CandidateResponse;
import com.tempstaff.dto.response.InterviewResponse;
import com.tempstaff.entity.User;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final UserRepository userRepository;

    /**
     * GET /api/interviews
     * Returns all interviews ordered by date descending, with candidate count.
     */
    @GetMapping
    public ResponseEntity<List<InterviewResponse>> getAllInterviews() {
        return ResponseEntity.ok(interviewService.getAllInterviews());
    }

    /**
     * GET /api/interviews/{id}/candidates
     * Returns all candidates for the given interview.
     */
    @GetMapping("/{id}/candidates")
    public ResponseEntity<List<CandidateResponse>> getCandidates(@PathVariable UUID id) {
        return ResponseEntity.ok(interviewService.getCandidatesForInterview(id));
    }

    /**
     * POST /api/interviews   (multipart/form-data)
     * Creates a new interview and imports candidates from the uploaded Excel file.
     *
     * Form fields:
     *   interviewNumber  – e.g. "Interview #4"
     *   date             – e.g. "2026-04-15"
     *   file             – .xlsx file
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InterviewResponse> createInterview(
            @RequestParam("interviewNumber") String interviewNumber,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("file") MultipartFile file) {

        try {
            InterviewResponse response = interviewService.createInterviewWithCandidates(
                    interviewNumber, date, file);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/interviews/{id}/date
     * Updates only the date of an existing interview.
     * Body: { "date": "2026-04-20" }
     */
    @PutMapping("/{id}/date")
    public ResponseEntity<InterviewResponse> updateDate(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        LocalDate newDate = LocalDate.parse(body.get("date"));
        return ResponseEntity.ok(interviewService.updateInterviewDate(id, newDate));
    }

    /**
     * Coordinator releases averaged marking results to HOD after reviewing (ended interview only).
     */
    @PutMapping("/{id}/report/release")
    public ResponseEntity<InterviewResponse> releaseReportToHod(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        try {
            return ResponseEntity.ok(interviewService.releaseInterviewReportToHod(id, caller.getId()));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
