package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertCurriculumModuleRequest {

    @NotBlank
    @Size(max = 30)
    private String code;

    @NotBlank
    @Size(max = 500)
    private String name;

    @NotNull
    private Integer academicLevel;

    @NotBlank
    @Size(max = 20)
    private String semesterLabel;

    @NotNull
    private Integer credits;

    @NotBlank
    @Size(max = 1)
    private String compulsoryOptional;

    private String chiefTutor;

    @NotBlank
    @Size(max = 3)
    private String programKind;

    @Size(max = 10)
    private String mitTrack;
}
