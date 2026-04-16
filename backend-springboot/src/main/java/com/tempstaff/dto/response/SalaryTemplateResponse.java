package com.tempstaff.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class SalaryTemplateResponse {
    private String id;
    private String periodKey;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal dayRate;
    private BigDecimal extraLeaveDayDeduction;
    private Integer totalWorkableDays;
    private String createdBy;
    private String updatedAt;
}

