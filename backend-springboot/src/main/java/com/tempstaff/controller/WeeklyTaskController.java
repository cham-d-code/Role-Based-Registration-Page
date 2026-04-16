package com.tempstaff.controller;

import com.tempstaff.dto.request.SaveWeeklyTasksRequest;
import com.tempstaff.dto.response.NextTaskResponse;
import com.tempstaff.dto.response.WeeklyTaskResponse;
import com.tempstaff.entity.DayOfWeek;
import com.tempstaff.entity.TaskStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.WeeklyTask;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.repository.WeeklyTaskRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks/weekly")
@RequiredArgsConstructor
public class WeeklyTaskController {

    private static final ZoneId SL = ZoneId.of("Asia/Colombo");
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("h:mm a");
    private static final DateTimeFormatter DATE_DISPLAY = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final WeeklyTaskRepository weeklyTaskRepository;
    private final UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    @PreAuthorize("hasRole('STAFF')")
    public List<WeeklyTaskResponse> getMyWeeklyTasks(@AuthenticationPrincipal UserDetails ud) {
        User me = currentUser(ud);
        return weeklyTaskRepository.findByUserIdOrderByDayOfWeekAscTimeFromAsc(me.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public List<WeeklyTaskResponse> saveMyWeeklyTasks(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody SaveWeeklyTasksRequest req
    ) {
        User me = currentUser(ud);
        // Replace all tasks for this user
        weeklyTaskRepository.deleteByUserId(me.getId());

        List<WeeklyTask> saved = req.getTasks().stream().map(row -> {
            WeeklyTask t = WeeklyTask.builder()
                    .userId(me.getId())
                    .dayOfWeek(DayOfWeek.valueOf(row.getDayOfWeek()))
                    .timeFrom(LocalTime.parse(row.getTimeFrom(), HM))
                    .timeTo(LocalTime.parse(row.getTimeTo(), HM))
                    .title(row.getTitle().trim())
                    .status(TaskStatus.pending)
                    .build();
            return weeklyTaskRepository.save(t);
        }).collect(Collectors.toList());

        return saved.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('STAFF')")
    public WeeklyTaskResponse updateStatus(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable UUID id,
            @RequestParam String status
    ) {
        User me = currentUser(ud);
        WeeklyTask t = weeklyTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!t.getUserId().equals(me.getId())) throw new RuntimeException("Not your task");
        t.setStatus(TaskStatus.valueOf(status));
        return toResponse(weeklyTaskRepository.save(t));
    }

    @GetMapping("/next")
    @PreAuthorize("hasRole('STAFF')")
    public NextTaskResponse getNextTask(@AuthenticationPrincipal UserDetails ud) {
        User me = currentUser(ud);
        List<WeeklyTask> tasks = weeklyTaskRepository
                .findByUserIdOrderByDayOfWeekAscTimeFromAsc(me.getId())
                .stream()
                .filter(t -> t.getStatus() != TaskStatus.completed)
                .collect(Collectors.toList());

        if (tasks.isEmpty()) return null;

        ZonedDateTime nowSL = ZonedDateTime.now(SL);
        DayOfWeek todayDow = DayOfWeek.valueOf(
                nowSL.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
        );
        LocalTime nowTime = nowSL.toLocalTime();

        // Order of days starting from today
        List<DayOfWeek> dows = List.of(DayOfWeek.values()); // enum ordering matches schema
        int todayIdx = todayDow.ordinal();

        WeeklyTask bestTask = null;
        long bestMinutes = Long.MAX_VALUE;

        for (int offset = 0; offset < 7; offset++) {
            int idx = (todayIdx + offset) % 7;
            DayOfWeek candidateDay = DayOfWeek.values()[idx];
            final int off = offset;
            List<WeeklyTask> dayTasks = tasks.stream()
                    .filter(t -> t.getDayOfWeek() == candidateDay)
                    .collect(Collectors.toList());

            for (WeeklyTask t : dayTasks) {
                long mins;
                if (off == 0) {
                    if (t.getTimeFrom().isAfter(nowTime)) {
                        mins = Duration.between(nowTime, t.getTimeFrom()).toMinutes();
                    } else {
                        continue; // already past today
                    }
                } else {
                    // minutes until midnight + day offset + timeFrom
                    long minsToMidnight = Duration.between(nowTime, LocalTime.MIDNIGHT).toMinutes() + 1;
                    long minsInFutureDays = (long)(off - 1) * 24 * 60;
                    mins = minsToMidnight + minsInFutureDays + t.getTimeFrom().toSecondOfDay() / 60L;
                }
                if (mins < bestMinutes) {
                    bestMinutes = mins;
                    bestTask = t;
                }
            }
            if (bestTask != null) break;
        }

        if (bestTask == null) return null;

        // Build human labels
        boolean isToday = bestTask.getDayOfWeek() == todayDow && bestTask.getTimeFrom().isAfter(nowTime);
        String timeUntil = formatTimeUntil(bestMinutes);

        ZonedDateTime taskDateTime = computeTaskDateTime(nowSL, bestTask.getDayOfWeek(), bestTask.getTimeFrom());
        String dateTimeLabel;
        if (isToday) {
            dateTimeLabel = "Today, " + bestTask.getTimeFrom().format(DISPLAY);
        } else if (taskDateTime.toLocalDate().equals(nowSL.toLocalDate().plusDays(1))) {
            dateTimeLabel = "Tomorrow, " + bestTask.getTimeFrom().format(DISPLAY);
        } else {
            dateTimeLabel = taskDateTime.format(DateTimeFormatter.ofPattern("EEEE d MMM, h:mm a"));
        }

        return NextTaskResponse.builder()
                .id(bestTask.getId().toString())
                .title(bestTask.getTitle())
                .dayOfWeek(bestTask.getDayOfWeek().name())
                .timeFrom(bestTask.getTimeFrom().format(HM))
                .timeTo(bestTask.getTimeTo().format(HM))
                .timeUntil(timeUntil)
                .dateTimeLabel(dateTimeLabel)
                .isToday(isToday)
                .build();
    }

    private String formatTimeUntil(long totalMinutes) {
        if (totalMinutes < 60) return totalMinutes + " min";
        long hours = totalMinutes / 60;
        long mins = totalMinutes % 60;
        if (hours < 24) return mins > 0 ? hours + " h " + mins + " min" : hours + " h";
        long days = hours / 24;
        return "in " + days + (days == 1 ? " day" : " days");
    }

    private ZonedDateTime computeTaskDateTime(ZonedDateTime now, DayOfWeek dow, LocalTime time) {
        java.time.DayOfWeek jDow = java.time.DayOfWeek.valueOf(dow.name().toUpperCase());
        ZonedDateTime candidate = now.with(jDow).with(time);
        if (!candidate.isAfter(now)) candidate = candidate.plusWeeks(1);
        return candidate;
    }

    private WeeklyTaskResponse toResponse(WeeklyTask t) {
        return WeeklyTaskResponse.builder()
                .id(t.getId().toString())
                .dayOfWeek(t.getDayOfWeek().name())
                .timeFrom(t.getTimeFrom().format(HM))
                .timeTo(t.getTimeTo().format(HM))
                .title(t.getTitle())
                .status(t.getStatus().name())
                .build();
    }
}
