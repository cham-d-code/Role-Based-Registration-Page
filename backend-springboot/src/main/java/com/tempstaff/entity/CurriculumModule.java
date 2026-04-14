package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "curriculum_modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumModule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(name = "academic_level", nullable = false)
    private Integer academicLevel;

    @Column(name = "semester_label", nullable = false, length = 20)
    private String semesterLabel;

    @Column(nullable = false)
    @Builder.Default
    private Integer credits = 3;

    @Column(name = "compulsory_optional", nullable = false, length = 1)
    @Builder.Default
    private String compulsoryOptional = "C";

    @Column(name = "chief_tutor", length = 255)
    private String chiefTutor;

    @Column(name = "program_kind", nullable = false, length = 3)
    private String programKind;

    @Column(name = "mit_track", length = 10)
    private String mitTrack;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
