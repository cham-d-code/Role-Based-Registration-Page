package com.tempstaff.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileResponse {

    private String id;
    private String email;
    private String fullName;
    private String mobile;
    private String role;
    private String status;
    private String profileImageUrl;
    private LocalDateTime createdAt;
}
