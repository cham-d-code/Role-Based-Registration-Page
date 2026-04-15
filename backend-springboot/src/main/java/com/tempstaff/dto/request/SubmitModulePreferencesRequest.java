package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SubmitModulePreferencesRequest {
    @NotNull
    private UUID requestId;

    @NotEmpty
    private List<UUID> moduleIds;
}

