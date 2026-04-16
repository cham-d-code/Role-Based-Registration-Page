package com.tempstaff.service;

import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.TaskStatus;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.entity.WeeklyTask;
import com.tempstaff.repository.UserNotificationRepository;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.repository.WeeklyTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

/**
 * Sends an in-app notification to each temp staff member 15 minutes before
 * their next upcoming weekly task, using Asia/Colombo (Sri Lanka) time.
 *
 * Runs every 5 minutes. Uses a deterministic dedup key embedded in the
 * notification message so we never send twice for the same slot on the same date.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyTaskReminderService {

    private static final ZoneId SL = ZoneId.of("Asia/Colombo");
    private static final int REMIND_MINUTES_BEFORE = 15;
    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("h:mm a");
    private static final DateTimeFormatter DATE_DISPLAY = DateTimeFormatter.ofPattern("EEEE, d MMM yyyy");

    private final WeeklyTaskRepository weeklyTaskRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 5 * 60 * 1000) // every 5 minutes
    public void sendUpcomingReminders() {
        ZonedDateTime nowSL = ZonedDateTime.now(SL);
        LocalTime nowTime = nowSL.toLocalTime();

        // Resolve today as our custom entity enum (not java.time.DayOfWeek)
        String todayName = nowSL.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        com.tempstaff.entity.DayOfWeek todayDow =
                com.tempstaff.entity.DayOfWeek.valueOf(todayName);

        List<User> staffList = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.staff));

        for (User staff : staffList) {
            List<WeeklyTask> tasks = weeklyTaskRepository
                    .findByUserIdOrderByDayOfWeekAscTimeFromAsc(staff.getId());

            for (WeeklyTask task : tasks) {
                if (task.getStatus() == TaskStatus.completed) continue;
                if (task.getDayOfWeek() != todayDow) continue;

                long minsUntil = Duration.between(nowTime, task.getTimeFrom()).toMinutes();
                if (minsUntil < 0 || minsUntil > REMIND_MINUTES_BEFORE) continue;

                // Dedup key: taskId + today's date
                String dedupKey = String.format("[reminder:%s:%s]",
                        task.getId(), nowSL.toLocalDate());

                String message = buildMessage(task, nowSL, dedupKey);
                boolean alreadySent = userNotificationRepository
                        .existsByRecipientIdAndTypeAndMessage(
                                staff.getId(), NotificationType.info, message);
                if (alreadySent) continue;

                String title = "Upcoming task in " + minsUntil + " min";
                notificationService.notifyUser(
                        staff.getId(), title, message, NotificationType.info, null, null);

                log.info("Sent task reminder to {} for task '{}' at {}",
                        staff.getEmail(), task.getTitle(), task.getTimeFrom());
            }
        }
    }

    private String buildMessage(WeeklyTask task, ZonedDateTime nowSL, String dedupKey) {
        return String.format("%s, %s — %s (from %s to %s) %s",
                nowSL.format(DATE_DISPLAY),
                nowSL.toLocalDate().toString(),
                task.getTitle(),
                task.getTimeFrom().format(DISPLAY),
                task.getTimeTo().format(DISPLAY),
                dedupKey);
    }
}
