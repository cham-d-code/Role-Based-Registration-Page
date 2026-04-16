package com.tempstaff.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMyProfileRequest {
    private String fullName;
    private String mobile;
    private String profileImageUrl;
    private String currentPassword;
    private String newPassword;
}

