package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "module_preference_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ModulePreferenceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "target_staff_id")
    private UUID targetStaffId;

    @Column(name = "message")
    private String message;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

