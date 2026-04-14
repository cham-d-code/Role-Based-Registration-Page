package com.tempstaff.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateContractRequest {
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
}

