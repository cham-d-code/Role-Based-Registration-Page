package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "module_preference_request_modules",
        uniqueConstraints = @UniqueConstraint(columnNames = {"request_id", "module_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ModulePreferenceRequestModule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "module_id", nullable = false)
    private UUID moduleId;
}

