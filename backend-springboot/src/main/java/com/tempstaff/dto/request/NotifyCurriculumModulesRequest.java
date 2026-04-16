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

    /**
     * Optional: if provided, send the request only to this staff member.
     * If null, request is broadcast to all approved staff.
     */
    private UUID staffId;
}
