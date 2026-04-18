package com.tempstaff.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InterviewResponse {

    private String id;
    private String interviewNumber;
    private LocalDate date;
    private String status;           // "upcoming" or "ended"
    private int candidateCount;
    private LocalDateTime createdAt;
    /** Present when coordinator released marking results to HOD (ended interviews only). */
    private LocalDateTime reportSentToHodAt;
}
