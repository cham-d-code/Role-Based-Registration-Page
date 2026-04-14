package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class NotifyCurriculumModulesRequest {

    @NotEmpty
    private List<UUID> moduleIds;

    private String message;
}
