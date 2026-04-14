package com.tempstaff.dto.request;

import com.tempstaff.entity.ResearchStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateResearchOpportunityRequest {
    private String title;
    private String description;
    private LocalDate deadline;
    private Integer maxApplicants;
    private ResearchStatus status;
}

