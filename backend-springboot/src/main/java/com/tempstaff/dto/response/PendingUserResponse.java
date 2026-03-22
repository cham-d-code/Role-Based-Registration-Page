package com.tempstaff.dto.response;

import com.tempstaff.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for pending user registrations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingUserResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String mobile;
    private UserRole role;
    private LocalDateTime createdAt;
}
