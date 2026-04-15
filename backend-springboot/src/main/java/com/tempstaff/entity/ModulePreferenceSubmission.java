package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "module_preference_submissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"request_id", "staff_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ModulePreferenceSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();
}

