package com.tempstaff.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SaveWeeklyTasksRequest {

    @NotNull
    @Valid
    private List<TaskRow> tasks;

    @Getter
    @Setter
    public static class TaskRow {
        @NotNull
        private String dayOfWeek;    // e.g. "Monday"

        @NotNull
        private String timeFrom;     // HH:mm  24-hour

        @NotNull
        private String timeTo;       // HH:mm  24-hour

        @NotNull
        private String title;
    }
}
