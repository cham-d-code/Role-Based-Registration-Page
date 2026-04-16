package com.tempstaff.dto.response;

import com.tempstaff.entity.RequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LeaveRequestResponse {

    private UUID id;
    private UUID staffId;
    private String staffName;
    private String staffEmail;

    private LocalDate leaveDate;
    private String reason;

    private UUID substituteId;
    private String substituteName;

    private RequestStatus status;

    private LocalDateTime submittedAt;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;

    private String rejectionReason;
}

