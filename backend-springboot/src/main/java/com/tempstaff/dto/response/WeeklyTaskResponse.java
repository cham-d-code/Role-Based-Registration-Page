package com.tempstaff.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WeeklyTaskResponse {
    private String id;
    private String dayOfWeek;
    private String timeFrom;   // HH:mm
    private String timeTo;     // HH:mm
    private String title;
    private String status;
}
