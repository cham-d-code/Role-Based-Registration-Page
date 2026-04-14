package com.tempstaff.service;

import com.tempstaff.entity.NotificationType;
import com.tempstaff.entity.UserNotification;
import com.tempstaff.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserNotificationRepository userNotificationRepository;

    public UserNotification notifyUser(
            UUID recipientId,
            String title,
            String message,
            NotificationType type,
            UUID relatedOpportunityId,
            UUID relatedApplicationId
    ) {
        UserNotification notification = UserNotification.builder()
                .recipientId(recipientId)
                .title(title)
                .message(message)
                .type(type)
                .relatedOpportunityId(relatedOpportunityId)
                .relatedApplicationId(relatedApplicationId)
                .isRead(false)
                .build();

        return userNotificationRepository.save(notification);
    }
}

