package com.tempstaff.controller;

import com.tempstaff.dto.response.UserNotificationResponse;
import com.tempstaff.entity.User;
import com.tempstaff.entity.UserNotification;
import com.tempstaff.repository.UserNotificationRepository;
import com.tempstaff.repository.UserRepository;
import com.tempstaff.support.NotificationBuckets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;

    private User currentUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<UserNotificationResponse>> listMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(name = "unreadOnly", required = false, defaultValue = "false") boolean unreadOnly,
            @RequestParam(name = "category", required = false) String category
    ) {
        User me = currentUser(userDetails);
        List<UserNotification> list = new ArrayList<>(unreadOnly
                ? userNotificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(me.getId(), false)
                : userNotificationRepository.findByRecipientIdOrderByCreatedAtDesc(me.getId()));

        if (category != null && category.equalsIgnoreCase("inbox")) {
            list = list.stream()
                    .filter(n -> !NotificationBuckets.REMINDER_TYPES.contains(n.getType()))
                    .collect(Collectors.toCollection(ArrayList::new));
        } else if (category != null && category.equalsIgnoreCase("reminders")) {
            list = list.stream()
                    .filter(n -> NotificationBuckets.REMINDER_TYPES.contains(n.getType()))
                    .collect(Collectors.toCollection(ArrayList::new));
        }

        return ResponseEntity.ok(list.stream().map(n -> UserNotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .relatedOpportunityId(n.getRelatedOpportunityId())
                .relatedApplicationId(n.getRelatedApplicationId())
                .createdAt(n.getCreatedAt())
                .build()).collect(Collectors.toList()));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID notificationId
    ) {
        User me = currentUser(userDetails);
        var n = userNotificationRepository.findByIdAndRecipientId(notificationId, me.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setIsRead(true);
        userNotificationRepository.save(n);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> unreadCount(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(name = "inboxOnly", required = false, defaultValue = "false") boolean inboxOnly
    ) {
        User me = currentUser(userDetails);
        long count = inboxOnly
                ? userNotificationRepository.countUnreadExcludingTypes(me.getId(), NotificationBuckets.REMINDER_TYPES)
                : userNotificationRepository.countByRecipientIdAndIsRead(me.getId(), false);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/read-all")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Map<String, Object>> markAllRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(name = "inboxOnly", required = false, defaultValue = "false") boolean inboxOnly
    ) {
        User me = currentUser(userDetails);
        int updated = inboxOnly
                ? userNotificationRepository.markReadForRecipientExcludingTypes(me.getId(), NotificationBuckets.REMINDER_TYPES)
                : userNotificationRepository.markAllAsReadForRecipient(me.getId());
        return ResponseEntity.ok(Map.of("success", true, "updated", updated));
    }
}

