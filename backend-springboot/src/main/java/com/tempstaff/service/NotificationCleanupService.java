package com.tempstaff.service;

import com.tempstaff.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Removes user notifications older than 7 days. Runs daily at 03:00 server time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationCleanupService {

    private static final int RETENTION_DAYS = 7;

    private final UserNotificationRepository userNotificationRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int removed = userNotificationRepository.deleteOlderThan(cutoff);
        if (removed > 0) {
            log.info("Purged {} notifications older than {} days (cutoff {})",
                    removed, RETENTION_DAYS, cutoff);
        }
    }
}
