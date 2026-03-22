package com.tempstaff.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private boolean success;
    private String message;
    private String token;
    private UserDto user;
    private String userId;
    private String resetToken; // Only in development mode

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private String id;
        private String email;
        private String fullName;
        private String role;

    }

    // Static factory methods
    public static AuthResponse success(String message) {
        return AuthResponse.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static AuthResponse error(String message) {
        return AuthResponse.builder()
                .success(false)
                .message(message)
                .build();
    }
}
