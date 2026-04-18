package com.tempstaff.service;

import com.tempstaff.entity.Interview;
import com.tempstaff.entity.InterviewStatus;
import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.InterviewRepository;
import com.tempstaff.repository.UserNotificationRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * Sends HOD reminders 3 / 2 / 1 day(s) before an upcoming interview.
 * Runs daily at 08:00 server time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewUpcomingReminderService {

    private static final Set<Long> MILESTONES_DAYS = Set.of(3L, 2L, 1L);

    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendUpcomingInterviewReminders() {
        LocalDate today = LocalDate.now();

        List<Interview> upcoming = interviewRepository.findByStatus(InterviewStatus.upcoming);
        if (upcoming.isEmpty()) return;

        List<User> hods = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.hod));
        if (hods.isEmpty()) return;

        LocalDateTime since = LocalDateTime.now().minusHours(20);

        for (Interview interview : upcoming) {
            if (interview.getDate() == null) continue;

            long daysLeft = ChronoUnit.DAYS.between(today, interview.getDate());
            if (!MILESTONES_DAYS.contains(daysLeft)) continue;

            String whenLabel = daysLeft == 1 ? "tomorrow" : daysLeft + " days";
            String title = "Upcoming interview reminder";
            String message = String.format(
                    "Interview %s is scheduled %s (%s). [interviewId=%s, milestoneDays=%d]",
                    interview.getInterviewNumber(),
                    whenLabel,
                    interview.getDate(),
                    interview.getId(),
                    daysLeft);

            for (User hod : hods) {
                boolean alreadySent = userNotificationRepository
                        .existsByRecipientIdAndTypeAndMessageAndCreatedAtAfter(
                                hod.getId(), NotificationType.interview_upcoming, message, since);
                if (alreadySent) continue;
                notificationService.notifyUser(
                        hod.getId(), title, message,
                        NotificationType.interview_upcoming, null, null);
            }
        }
    }
}
