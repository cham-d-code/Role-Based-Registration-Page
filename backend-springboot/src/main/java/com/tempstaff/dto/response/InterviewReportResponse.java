package com.tempstaff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
        private String candidateName;
        private String candidateEmail;

        /** markerId → list of marks per criterion (in same order as criteria) */
        private List<MarkerResult> markerResults;

        /** Average total across all participating markers */
        private double averageTotal;
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
