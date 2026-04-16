package com.tempstaff.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class JobDescriptionResponse {
    private String userId;
    private String content;
    private LocalDateTime createdAt;
}

