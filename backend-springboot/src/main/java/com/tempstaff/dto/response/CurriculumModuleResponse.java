package com.tempstaff.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumModuleResponse {
    private String id;
    private String code;
    private String name;
    private String chiefTutor;
    private Integer academicLevel;
    private String semesterLabel;
    private Integer credits;
    private String compulsoryOptional;
    private String programKind;
    private String mitTrack;
}
