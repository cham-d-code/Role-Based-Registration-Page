package com.tempstaff.controller;

import com.tempstaff.dto.response.UserNotificationResponse;
import com.tempstaff.entity.User;
import com.tempstaff.repository.UserNotificationRepository;
import com.tempstaff.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(name = "unreadOnly", required = false, defaultValue = "false") boolean unreadOnly
    ) {
        User me = currentUser(userDetails);
        var list = unreadOnly
                ? userNotificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(me.getId(), false)
                : userNotificationRepository.findByRecipientIdOrderByCreatedAtDesc(me.getId());

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
}

