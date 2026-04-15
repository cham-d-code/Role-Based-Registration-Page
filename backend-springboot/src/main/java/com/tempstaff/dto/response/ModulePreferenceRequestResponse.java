package com.tempstaff.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ModulePreferenceRequestResponse {
    private String id;
    private String message;
    private LocalDateTime createdAt;
    private boolean submittedByMe;
    private List<CurriculumModuleResponse> modules;
}

