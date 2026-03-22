package com.tempstaff.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "candidates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "candidate_id")
    private String candidateId;  // From Excel upload (e.g. "C001")

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(name = "marks_part1")
    private Integer marksPart1;

    @Column(name = "marks_part2")
    private Integer marksPart2;

    @Column(name = "marks_part3")
    private Integer marksPart3;

    @Column(name = "total_marks")
    private Integer totalMarks;

    @Column(name = "is_shortlisted", nullable = false)
    @Builder.Default
    private Boolean shortlisted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;
}
