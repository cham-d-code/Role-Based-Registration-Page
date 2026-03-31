package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "candidate_marks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "candidate_id", "marker_id", "criterion_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateMark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marker_id", nullable = false)
    private User marker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criterion_id", nullable = false)
    private MarkingCriterion criterion;

    @Column(name = "marks_given", nullable = false)
    private int marksGiven;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "marked_at", nullable = false)
    @Builder.Default
    private LocalDateTime markedAt = LocalDateTime.now();
}
