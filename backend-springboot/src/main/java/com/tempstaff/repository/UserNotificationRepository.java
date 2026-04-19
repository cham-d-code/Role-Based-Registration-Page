package com.tempstaff.repository;

import com.tempstaff.entity.UserNotification;
import com.tempstaff.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {
    List<UserNotification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    List<UserNotification> findByRecipientIdAndIsReadOrderByCreatedAtDesc(UUID recipientId, Boolean isRead);

    long countByRecipientIdAndIsRead(UUID recipientId, Boolean isRead);

    @Query("select count(n) from UserNotification n where n.recipientId = :recipientId and n.isRead = false and n.type not in :excludeTypes")
    long countUnreadExcludingTypes(
            @Param("recipientId") UUID recipientId,
            @Param("excludeTypes") java.util.Collection<NotificationType> excludeTypes);

    boolean existsByRecipientIdAndTypeAndMessage(UUID recipientId, NotificationType type, String message);

    boolean existsByRecipientIdAndTypeAndMessageAndCreatedAtAfter(
            UUID recipientId, NotificationType type, String message, LocalDateTime after);

    Optional<UserNotification> findByIdAndRecipientId(UUID id, UUID recipientId);

    List<UserNotification> findByRecipientIdAndTypeAndRelatedOpportunityId(
            UUID recipientId, NotificationType type, UUID relatedOpportunityId);

    List<UserNotification> findByRecipientIdAndTypeAndRelatedApplicationId(
            UUID recipientId, NotificationType type, UUID relatedApplicationId);

    @Modifying
    @Query("update UserNotification n set n.isRead = true where n.recipientId = :recipientId and n.isRead = false")
    int markAllAsReadForRecipient(@Param("recipientId") UUID recipientId);

    @Modifying
    @Query("update UserNotification n set n.isRead = true where n.recipientId = :recipientId and n.isRead = false and n.type not in :excludeTypes")
    int markReadForRecipientExcludingTypes(
            @Param("recipientId") UUID recipientId,
            @Param("excludeTypes") java.util.Collection<NotificationType> excludeTypes);

    @Modifying
    @Query("delete from UserNotification n where n.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);

    /** Marks matching notifications read for every recipient (e.g. mentor + HOD copies of the same application). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserNotification n set n.isRead = true where n.type = :type and n.relatedApplicationId = :applicationId and n.isRead = false")
    int markAllReadByTypeAndRelatedApplicationId(
            @Param("type") NotificationType type,
            @Param("applicationId") UUID applicationId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserNotification n WHERE n.recipientId = :userId")
    void deleteAllByRecipientId(@Param("userId") UUID userId);
}
