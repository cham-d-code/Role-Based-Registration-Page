package com.tempstaff.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private String specialization;
    private LocalDateTime createdAt;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private List<String> preferredSubjects;
    private Integer menteesCount;
    private String mentorId;
    private String mentorName;
    private List<String> preferredModules;
    private Boolean preferencesRequested;
}
