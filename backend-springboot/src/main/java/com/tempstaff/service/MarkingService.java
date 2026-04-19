package com.tempstaff.service;

import com.tempstaff.dto.request.SaveMarkingSchemeRequest;
import com.tempstaff.dto.request.SubmitMarksRequest;
import com.tempstaff.dto.response.InterviewReportResponse;
import com.tempstaff.dto.response.MarkingSchemeResponse;
import com.tempstaff.entity.*;
import com.tempstaff.repository.*;
import com.tempstaff.support.InterviewReportExcelExporter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarkingService {

    private final MarkingSchemeRepository schemeRepo;
    private final CandidateMarkRepository markRepo;
    private final InterviewRepository interviewRepo;
    private final InterviewSessionRepository sessionRepo;
    private final SessionParticipantRepository participantRepo;
    private final UserRepository userRepo;
    private final CandidateRepository candidateRepo;

    // ─── Scheme ───────────────────────────────────────────────────────────────

    @Transactional
    public MarkingSchemeResponse saveScheme(UUID interviewId, UUID creatorId,
                                            SaveMarkingSchemeRequest req) {
        if (req.getCriteria() == null || req.getCriteria().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one marking criterion is required.");
        }
        for (SaveMarkingSchemeRequest.CriterionInput c : req.getCriteria()) {
            if (c.getName() == null || c.getName().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each criterion must have a name.");
            }
            if (c.getMaxMarks() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each criterion must have maximum marks greater than zero.");
            }
        }

        Interview interview = interviewRepo.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        User creator = userRepo.findById(creatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (creator.getRole() != UserRole.coordinator && creator.getRole() != UserRole.hod) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the Temporary Staff Coordinator or Head of Department can create or update the marking scheme.");
        }

        // Replace scheme: delete marks that point at old criteria first (avoids FK / orphan issues), then remove scheme.
        schemeRepo.findByInterviewId(interviewId).ifPresent(existing -> {
            markRepo.deleteAllByMarkingSchemeId(existing.getId());
            schemeRepo.delete(existing);
        });

        MarkingScheme scheme = MarkingScheme.builder()
                .interview(interview)
                .createdBy(creator)
                .build();
        scheme = schemeRepo.save(scheme);

        List<MarkingCriterion> criteriaEntities = new ArrayList<>();
        for (int i = 0; i < req.getCriteria().size(); i++) {
            SaveMarkingSchemeRequest.CriterionInput c = req.getCriteria().get(i);
            criteriaEntities.add(MarkingCriterion.builder()
                    .scheme(scheme)
                    .name(c.getName())
                    .maxMarks(c.getMaxMarks())
                    .displayOrder(i)
                    .build());
        }
        scheme.getCriteria().addAll(criteriaEntities);
        scheme = schemeRepo.save(scheme);

        return toSchemeResponse(scheme);
    }

    @Transactional(readOnly = true)
    public Optional<MarkingSchemeResponse> getScheme(UUID interviewId) {
        return schemeRepo.findByInterviewId(interviewId).map(this::toSchemeResponse);
    }

    // ─── Submit marks ─────────────────────────────────────────────────────────

    @Transactional
    public void submitMarks(UUID interviewId, UUID candidateId, UUID markerId,
                            SubmitMarksRequest req) {
        InterviewSession session = sessionRepo.findByInterviewIdAndActiveTrue(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No active session for this interview"));

        Candidate candidate = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));
        User marker = userRepo.findById(markerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        SessionParticipant markerParticipant = participantRepo
                .findBySessionIdAndUserId(session.getId(), markerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not a participant in this interview session."));
        if (!"active".equals(markerParticipant.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You must be admitted to the session before you can submit marks.");
        }
        if (markerParticipant.isLeftSession()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You have left this session and cannot submit marks.");
        }

        MarkingScheme scheme = schemeRepo.findByInterviewId(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No marking scheme for this interview"));

        Map<UUID, MarkingCriterion> criterionMap = scheme.getCriteria().stream()
                .collect(Collectors.toMap(MarkingCriterion::getId, c -> c));

        // Replace existing marks from this marker for this candidate
        markRepo.deleteBySessionIdAndCandidateIdAndMarkerId(session.getId(), candidateId, markerId);
        // Ensure deletes hit the DB before inserts (otherwise UNIQUE(session_id, candidate_id, marker_id, criterion_id) can fail).
        markRepo.flush();

        LinkedHashMap<UUID, SubmitMarksRequest.MarkEntry> latestByCriterion = new LinkedHashMap<>();
        for (SubmitMarksRequest.MarkEntry entry : req.getMarks()) {
            UUID criterionId;
            try {
                criterionId = UUID.fromString(entry.getCriterionId());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid criterion id.");
            }
            latestByCriterion.put(criterionId, entry);
        }

        for (Map.Entry<UUID, SubmitMarksRequest.MarkEntry> e : latestByCriterion.entrySet()) {
            UUID criterionId = e.getKey();
            SubmitMarksRequest.MarkEntry entry = e.getValue();
            MarkingCriterion criterion = criterionMap.get(criterionId);
            if (criterion == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown criterion. The marking scheme may have been updated — refresh the interview page.");
            }

            markRepo.save(CandidateMark.builder()
                    .session(session)
                    .candidate(candidate)
                    .marker(marker)
                    .criterion(criterion)
                    .marksGiven(Math.min(entry.getMarksGiven(), criterion.getMaxMarks()))
                    .comments(req.getComments())
                    .build());
        }
    }

    // ─── Report ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InterviewReportResponse getReport(UUID interviewId) {
        Interview interview = interviewRepo.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));

        // Use most recent session (active or ended)
        InterviewSession session = sessionRepo
                .findTopByInterviewIdOrderByStartedAtDesc(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No session found for this interview"));

        MarkingScheme scheme = schemeRepo.findByInterviewId(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No marking scheme for this interview"));

        List<MarkingSchemeResponse.CriterionResponse> criteriaList = scheme.getCriteria().stream()
                .map(c -> MarkingSchemeResponse.CriterionResponse.builder()
                        .id(c.getId().toString())
                        .name(c.getName())
                        .maxMarks(c.getMaxMarks())
                        .displayOrder(c.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        int totalMaxMarks = scheme.getCriteria().stream().mapToInt(MarkingCriterion::getMaxMarks).sum();

        // Averages use marks from panelists who were not removed and did not step off the active panel
        // (left_session). Do not exclude everyone with status "waiting" — that includes people still in
        // the waiting room who never submitted marks; it also wrongly excluded some DB rows where status
        // lagged behind active marking.
        Set<UUID> excludedMarkers = participantRepo.findBySessionId(session.getId()).stream()
                .filter(p -> p.isLeftSession()
                        || "removed".equalsIgnoreCase(p.getStatus()))
                .map(p -> p.getUser().getId())
                .collect(Collectors.toSet());

        // All marks for this session
        List<CandidateMark> allMarks = markRepo.findBySessionId(session.getId());

        // Group by candidate
        Map<UUID, List<CandidateMark>> byCand = allMarks.stream()
                .collect(Collectors.groupingBy(m -> m.getCandidate().getId()));

        // All candidates for this interview
        List<Candidate> candidates = candidateRepo.findByInterviewId(interviewId);

        List<InterviewReportResponse.CandidateReport> candReports = new ArrayList<>();
        for (Candidate cand : candidates) {
            List<CandidateMark> candMarks = byCand.getOrDefault(cand.getId(), Collections.emptyList());

            Map<UUID, List<CandidateMark>> byMarker = candMarks.stream()
                    .filter(m -> !excludedMarkers.contains(m.getMarker().getId()))
                    .collect(Collectors.groupingBy(m -> m.getMarker().getId()));

            List<InterviewReportResponse.MarkerResult> markerResults = new ArrayList<>();
            for (Map.Entry<UUID, List<CandidateMark>> entry : byMarker.entrySet()) {
                User marker = entry.getValue().get(0).getMarker();
                Map<String, Integer> marksByCriterion = entry.getValue().stream()
                        .collect(Collectors.toMap(
                                m -> m.getCriterion().getId().toString(),
                                CandidateMark::getMarksGiven,
                                (a, b) -> b,
                                LinkedHashMap::new
                        ));
                int total = marksByCriterion.values().stream().mapToInt(Integer::intValue).sum();
                String comments = entry.getValue().stream()
                        .map(CandidateMark::getComments).filter(Objects::nonNull)
                        .findFirst().orElse(null);

                markerResults.add(InterviewReportResponse.MarkerResult.builder()
                        .markerId(marker.getId().toString())
                        .markerName(marker.getFullName())
                        .markerRole(marker.getRole().name())
                        .marksByCriterion(marksByCriterion)
                        .total(total)
                        .comments(comments)
                        .build());
            }

            int markerCount = markerResults.size();
            double avgTotal = markerResults.stream()
                    .mapToInt(InterviewReportResponse.MarkerResult::getTotal)
                    .average().orElse(0.0);

            Map<String, Double> avgByCriterion = new LinkedHashMap<>();
            for (MarkingSchemeResponse.CriterionResponse crit : criteriaList) {
                List<Integer> vals = markerResults.stream()
                        .map(mr -> mr.getMarksByCriterion().get(crit.getId()))
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                double critAvg = vals.isEmpty() ? 0.0
                        : vals.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                avgByCriterion.put(crit.getId(), Math.round(critAvg * 10.0) / 10.0);
            }

            candReports.add(InterviewReportResponse.CandidateReport.builder()
                    .candidateId(cand.getId().toString())
                    .displayCandidateId(cand.getCandidateId())
                    .candidateName(cand.getName())
                    .candidateEmail(cand.getEmail())
                    .markerResults(markerResults)
                    .averageTotal(Math.round(avgTotal * 10.0) / 10.0)
                    .averageMarksByCriterion(avgByCriterion)
                    .markersIncludedCount(markerCount)
                    .maxTotal(totalMaxMarks)
                    .build());
        }

        // Sort by average descending
        candReports.sort(Comparator.comparingDouble(InterviewReportResponse.CandidateReport::getAverageTotal).reversed());

        return InterviewReportResponse.builder()
                .interviewId(interview.getId().toString())
                .interviewNumber(interview.getInterviewNumber())
                .sessionId(session.getId().toString())
                .criteria(criteriaList)
                .totalMaxMarks(totalMaxMarks)
                .candidates(candReports)
                .build();
    }

    /** Same data as {@link #getReport(UUID)} as an Excel workbook (HOD after release, or coordinator). */
    @Transactional(readOnly = true)
    public byte[] exportInterviewReportExcel(UUID interviewId) {
        Interview interview = interviewRepo.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        InterviewReportResponse report = getReport(interviewId);
        Map<String, InterviewReportExcelExporter.CandidateMeta> meta = candidateRepo.findByInterviewId(interviewId).stream()
                .collect(Collectors.toMap(
                        c -> c.getId().toString(),
                        c -> new InterviewReportExcelExporter.CandidateMeta(
                                c.getPhone() != null ? c.getPhone() : "",
                                Boolean.TRUE.equals(c.getShortlisted()))));
        return InterviewReportExcelExporter.build(report, meta, interview.getDate());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private MarkingSchemeResponse toSchemeResponse(MarkingScheme s) {
        List<MarkingSchemeResponse.CriterionResponse> cList = s.getCriteria().stream()
                .map(c -> MarkingSchemeResponse.CriterionResponse.builder()
                        .id(c.getId().toString())
                        .name(c.getName())
                        .maxMarks(c.getMaxMarks())
                        .displayOrder(c.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());
        int total = s.getCriteria().stream().mapToInt(MarkingCriterion::getMaxMarks).sum();
        return MarkingSchemeResponse.builder()
                .schemeId(s.getId().toString())
                .interviewId(s.getInterview().getId().toString())
                .createdByName(s.getCreatedBy().getFullName())
                .criteria(cList)
                .totalMaxMarks(total)
                .build();
    }
}
