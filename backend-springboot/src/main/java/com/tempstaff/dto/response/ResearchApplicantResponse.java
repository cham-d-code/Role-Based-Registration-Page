package com.tempstaff.dto.response;

import com.tempstaff.entity.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ResearchApplicantResponse {
    private UUID applicationId;
    private UUID userId;
    private String fullName;
    private String email;
    private List<String> specializations;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}

