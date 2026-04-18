package com.tempstaff.service;

import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.UserNotificationRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

/**
 * On the 10th of every month at 08:00, reminds HODs to review:
 *  - the monthly salary reports
 *  - the monthly attendance reports
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlyReviewReminderService {

    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 10 * *")
    public void sendMonthlyReviewReminders() {
        List<User> hods = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.hod));
        if (hods.isEmpty()) return;

        YearMonth ym = YearMonth.now();
        String period = ym.toString(); // e.g. "2026-04"
        LocalDateTime since = LocalDateTime.now().minusHours(20);

        String salaryTitle = "Review monthly salary reports";
        String salaryMsg = String.format(
                "It's the 10th — please review the salary reports for %s.", period);

        String attendanceTitle = "Review monthly attendance reports";
        String attendanceMsg = String.format(
                "It's the 10th — please review the attendance reports for %s.", period);

        for (User hod : hods) {
            if (!userNotificationRepository.existsByRecipientIdAndTypeAndMessageAndCreatedAtAfter(
                    hod.getId(), NotificationType.review_due, salaryMsg, since)) {
                notificationService.notifyUser(
                        hod.getId(), salaryTitle, salaryMsg,
                        NotificationType.review_due, null, null);
            }
            if (!userNotificationRepository.existsByRecipientIdAndTypeAndMessageAndCreatedAtAfter(
                    hod.getId(), NotificationType.review_due, attendanceMsg, since)) {
                notificationService.notifyUser(
                        hod.getId(), attendanceTitle, attendanceMsg,
                        NotificationType.review_due, null, null);
            }
        }
    }
}
