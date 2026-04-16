package com.tempstaff.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NextTaskResponse {
    private String id;
    private String title;
    private String dayOfWeek;
    private String timeFrom;
    private String timeTo;
    /** Human-readable label like "45 min", "2 h", "in 3 days" */
    private String timeUntil;
    /** e.g. "Today, 3:30 PM" */
    private String dateTimeLabel;
    private boolean isToday;
}
