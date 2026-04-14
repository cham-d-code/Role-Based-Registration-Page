package com.tempstaff.dto.request;

import com.tempstaff.entity.ResearchStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateResearchOpportunityRequest {
    @NotBlank
    private String title;

    private String description;

    private LocalDate deadline;

    private Integer maxApplicants;

    private ResearchStatus status;
}

