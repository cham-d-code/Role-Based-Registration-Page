package com.tempstaff.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionStateResponse {

    private String sessionId;
    private String interviewId;
    private String interviewNumber;
    private LocalDateTime startedAt;
    private String startedByName;

    /** Current user's status: "active" | "waiting" | "removed" | null (not in session) */
    private String myStatus;

    private List<ParticipantInfo> activeParticipants;
    private List<ParticipantInfo> waitingParticipants;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ParticipantInfo {
        private String userId;
        private String fullName;
        private String role;
        private String initials;
    }
}
