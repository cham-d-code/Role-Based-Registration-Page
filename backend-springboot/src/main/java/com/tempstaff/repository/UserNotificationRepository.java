package com.tempstaff.repository;

import com.tempstaff.entity.UserNotification;
import com.tempstaff.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {
    List<UserNotification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    List<UserNotification> findByRecipientIdAndIsReadOrderByCreatedAtDesc(UUID recipientId, Boolean isRead);

    boolean existsByRecipientIdAndTypeAndMessage(UUID recipientId, NotificationType type, String message);

    Optional<UserNotification> findByIdAndRecipientId(UUID id, UUID recipientId);
}

