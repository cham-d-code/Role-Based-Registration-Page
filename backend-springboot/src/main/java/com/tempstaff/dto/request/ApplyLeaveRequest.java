package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ApplyLeaveRequest {

    @NotNull
    private LocalDate leaveDate;

    @NotBlank
    private String reason;

    @NotNull
    private UUID substituteId;
}

