package com.tempstaff.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferredSubjectsRequest {
    private List<String> preferredSubjects;
}

