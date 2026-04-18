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

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * Sends contract expiry reminders to HOD + Coordinator at:
 * 3 months (90d), 2 months (60d), 1 month (30d), 2 weeks (14d), 1 week (7d) before expiry.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContractExpiryReminderService {

    private static final Set<Long> MILESTONES_DAYS = Set.of(90L, 60L, 30L, 14L, 7L);

    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final NotificationService notificationService;

    // Run daily at 08:00 server time
    @Scheduled(cron = "0 0 8 * * *")
    public void sendContractExpiryReminders() {
        LocalDate today = LocalDate.now();

        List<User> staff = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.staff));
        if (staff.isEmpty()) return;

        List<User> management = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.hod, UserRole.coordinator));
        if (management.isEmpty()) return;

        for (User s : staff) {
            if (s.getContractEndDate() == null) continue;

            long daysLeft = ChronoUnit.DAYS.between(today, s.getContractEndDate());
            if (!MILESTONES_DAYS.contains(daysLeft)) continue;

            String whenLabel = switch ((int) daysLeft) {
                case 90 -> "3 months";
                case 60 -> "2 months";
                case 30 -> "1 month";
                case 14 -> "2 weeks";
                case 7 -> "1 week";
                default -> daysLeft + " days";
            };

            String title = "Contract expiry reminder";
            String message = String.format(
                    "Contract expiry reminder (%s before): %s contract ends on %s. [staffId=%s, milestoneDays=%d]",
                    whenLabel,
                    s.getFullName(),
                    s.getContractEndDate(),
                    s.getId(),
                    daysLeft
            );

            for (User m : management) {
                boolean alreadySent = userNotificationRepository.existsByRecipientIdAndTypeAndMessage(
                        m.getId(), NotificationType.contract_expiry, message);
                if (alreadySent) continue;

                notificationService.notifyUser(
                        m.getId(),
                        title,
                        message,
                        NotificationType.contract_expiry,
                        null,
                        null
                );
            }

            if (s.getMentorId() != null) {
                userRepository.findById(s.getMentorId()).ifPresent(mentor -> {
                    if (mentor.getStatus() != UserStatus.approved || mentor.getRole() != UserRole.mentor) {
                        return;
                    }
                    String mentorMessage = String.format(
                            "Mentee contract reminder (%s before): %s contract ends on %s. [staffId=%s, milestoneDays=%d]",
                            whenLabel,
                            s.getFullName(),
                            s.getContractEndDate(),
                            s.getId(),
                            daysLeft
                    );
                    if (userNotificationRepository.existsByRecipientIdAndTypeAndMessage(
                            mentor.getId(), NotificationType.contract_expiry, mentorMessage)) {
                        return;
                    }
                    notificationService.notifyUser(
                            mentor.getId(),
                            title,
                            mentorMessage,
                            NotificationType.contract_expiry,
                            null,
                            null
                    );
                });
            }
        }
    }
}

