package com.tempstaff.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class SubmitMarksRequest {
    private List<MarkEntry> marks;
    private String comments;

    @Data
    public static class MarkEntry {
        private String criterionId;
        private int marksGiven;
    }
}
