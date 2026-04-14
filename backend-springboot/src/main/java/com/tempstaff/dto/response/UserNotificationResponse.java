package com.tempstaff.dto.response;

import com.tempstaff.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserNotificationResponse {
    private UUID id;
    private String title;
    private String message;
    private NotificationType type;
    private Boolean isRead;
    private UUID relatedOpportunityId;
    private UUID relatedApplicationId;
    private LocalDateTime createdAt;
}

