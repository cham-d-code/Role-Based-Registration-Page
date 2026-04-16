package com.tempstaff.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class SalaryReportResponse {
    private String id;
    private String staffId;
    private String staffName;
    private String staffEmail;
    private String periodKey;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Integer totalWorkableDays;
    private BigDecimal presentDays;
    private BigDecimal leaveDays;
    private BigDecimal absentDays;
    private BigDecimal freeLeaveDays;
    private BigDecimal extraLeaveDays;
    private BigDecimal dayRate;
    private BigDecimal grossSalary;
    private BigDecimal deductionAmount;
    private BigDecimal netSalary;
    private String status;
    private LocalDateTime sentToHodAt;
    private String reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String reviewNote;
}

