package com.tempstaff.service;

import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import com.tempstaff.repository.JobDescriptionRepository;
import com.tempstaff.repository.UserNotificationRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Daily reminder to HOD + Coordinator: create JD for staff who submitted module preferences but have no JD yet.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ModulePreferencesJdReminderService {

    private final UserRepository userRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final ModulePreferenceService modulePreferenceService;
    private final UserNotificationRepository userNotificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyJdPendingReminders() {
        List<User> staffUsers = userRepository.findByStatusAndRoleIn(UserStatus.approved, List.of(UserRole.staff));
        if (staffUsers.isEmpty()) return;

        List<User> management = userRepository.findByStatusAndRoleIn(
                UserStatus.approved, List.of(UserRole.hod, UserRole.coordinator));
        if (management.isEmpty()) return;

        List<UUID> staffIds = staffUsers.stream().map(User::getId).collect(Collectors.toList());
        Set<UUID> submitted = modulePreferenceService.staffSubmittedForLatestRequest(staffIds);
        if (submitted.isEmpty()) return;

        LocalDate today = LocalDate.now();
        LocalDateTime since = LocalDateTime.now().minusHours(20);

        for (UUID staffId : submitted) {
            if (jobDescriptionRepository.findByUser_Id(staffId).isPresent()) {
                continue;
            }

            String staffName = userRepository.findById(staffId).map(User::getFullName).orElse("Staff");
            String message = String.format(
                    "Reminder: create job description for %s (module preferences received). [staffId=%s, day=%s]",
                    staffName,
                    staffId,
                    today
            );
            String title = "Create job description";

            for (User m : management) {
                boolean alreadySent = userNotificationRepository.existsByRecipientIdAndTypeAndMessageAndCreatedAtAfter(
                        m.getId(), NotificationType.jd_pending, message, since);
                if (alreadySent) continue;
                notificationService.notifyUser(
                        m.getId(),
                        title,
                        message,
                        NotificationType.jd_pending,
                        null,
                        null
                );
            }
        }
    }
}
