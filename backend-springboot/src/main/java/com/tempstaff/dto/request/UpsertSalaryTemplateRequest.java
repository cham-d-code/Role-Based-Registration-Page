package com.tempstaff.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpsertSalaryTemplateRequest {

    /**
     * YYYY-MM (period start month). Salary period will be from 10th of this month to 10th of next month.
     */
    @NotBlank
    private String periodKey;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal dayRate;

    /**
     * Deduction amount per extra leave day (after 2 free leaves).
     */
    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal extraLeaveDayDeduction;

    @NotNull
    @Min(0)
    private Integer totalWorkableDays;
}

