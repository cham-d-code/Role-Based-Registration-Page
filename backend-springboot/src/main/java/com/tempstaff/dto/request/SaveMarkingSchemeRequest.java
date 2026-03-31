package com.tempstaff.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class SaveMarkingSchemeRequest {
    private List<CriterionInput> criteria;

    @Data
    public static class CriterionInput {
        private String name;
        private int maxMarks;
    }
}
