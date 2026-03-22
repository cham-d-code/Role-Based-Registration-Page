package com.tempstaff.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidateResponse {

    private String id;
    private String candidateId;   // from Excel "Candidate ID" column
    private String name;
    private String email;
    private String phone;
    private String cvUrl;
    private Integer marksPart1;
    private Integer marksPart2;
    private Integer marksPart3;
    private Integer totalMarks;
    private Boolean shortlisted;
}
