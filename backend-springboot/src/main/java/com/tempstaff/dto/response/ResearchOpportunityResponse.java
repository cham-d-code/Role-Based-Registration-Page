package com.tempstaff.dto.response;

import com.tempstaff.entity.ResearchStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ResearchOpportunityResponse {
    private UUID id;
    private String title;
    private String description;
    private ResearchStatus status;
    private LocalDate deadline;
    private Integer maxApplicants;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private Long applicantsCount;
}

