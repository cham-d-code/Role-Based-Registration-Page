package com.tempstaff.dto.response;

import com.tempstaff.entity.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ResearchApplicationResponse {
    private UUID id;
    private UUID opportunityId;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}

