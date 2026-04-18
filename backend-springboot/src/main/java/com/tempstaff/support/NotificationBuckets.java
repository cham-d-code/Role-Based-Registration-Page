package com.tempstaff.support;

import com.tempstaff.entity.NotificationType;

import java.util.Set;

/**
 * Reminder-style notifications (time-based) shown on dashboards; inbox/alerts use all other types.
 */
public final class NotificationBuckets {

    private NotificationBuckets() {
    }

    public static final Set<NotificationType> REMINDER_TYPES = Set.of(
            NotificationType.interview_upcoming,
            NotificationType.interview_scheduled,
            NotificationType.contract_expiry,
            NotificationType.review_due,
            NotificationType.jd_pending
    );
}
