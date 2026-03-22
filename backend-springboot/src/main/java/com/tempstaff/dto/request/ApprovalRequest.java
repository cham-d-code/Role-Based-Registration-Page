package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for approving or rejecting a user registration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    private String rejectionReason; // Optional, used when rejecting
}
