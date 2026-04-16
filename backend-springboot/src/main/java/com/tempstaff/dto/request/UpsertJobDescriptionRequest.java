package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpsertJobDescriptionRequest {
    @NotBlank
    private String content;
}

