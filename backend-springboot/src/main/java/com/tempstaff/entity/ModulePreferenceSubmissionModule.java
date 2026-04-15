package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "module_preference_submission_modules",
        uniqueConstraints = @UniqueConstraint(columnNames = {"submission_id", "module_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ModulePreferenceSubmissionModule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    @Column(name = "module_id", nullable = false)
    private UUID moduleId;
}

