package com.tempstaff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MarkingSchemeResponse {
    private String schemeId;
    private String interviewId;
    private String createdByName;
    private List<CriterionResponse> criteria;
    private int totalMaxMarks;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CriterionResponse {
        private String id;
        private String name;
        private int maxMarks;
        private int displayOrder;
    }
}
