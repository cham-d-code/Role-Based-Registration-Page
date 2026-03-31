package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "marking_criteria")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MarkingCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheme_id", nullable = false)
    private MarkingScheme scheme;

    @Column(nullable = false)
    private String name;

    @Column(name = "max_marks", nullable = false)
    private int maxMarks;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;
}
