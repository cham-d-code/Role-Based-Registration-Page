package com.tempstaff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InterviewReportResponse {

    private String interviewId;
    private String interviewNumber;
    private String sessionId;

    /** The marking criteria used */
    private List<MarkingSchemeResponse.CriterionResponse> criteria;
    private int totalMaxMarks;

    /** Per-candidate rows */
    private List<CandidateReport> candidates;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CandidateReport {
        private String candidateId;
        /** Excel / display candidate id when imported */
        private String displayCandidateId;
        private String candidateName;
        private String candidateEmail;

        /** markerId → list of marks per criterion (in same order as criteria) */
        private List<MarkerResult> markerResults;

        /** Average total across markers included in scoring (active panel, not removed / not left) */
        private double averageTotal;
        /** Per-criterion average of marks from those same markers */
        @Builder.Default
        private Map<String, Double> averageMarksByCriterion = new LinkedHashMap<>();
        /** How many markers were averaged (same for total and per-criterion where they gave a score) */
        private int markersIncludedCount;
        private int maxTotal;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MarkerResult {
        private String markerId;
        private String markerName;
        private String markerRole;

        /** criterionId → marksGiven */
        private Map<String, Integer> marksByCriterion;
        private int total;
        private String comments;
    }
}
