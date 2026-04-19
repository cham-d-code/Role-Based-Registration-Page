package com.tempstaff.repository;

import com.tempstaff.entity.MarkingScheme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarkingSchemeRepository extends JpaRepository<MarkingScheme, UUID> {
    Optional<MarkingScheme> findByInterviewId(UUID interviewId);
    boolean existsByInterviewId(UUID interviewId);

    List<MarkingScheme> findByCreatedBy_Id(UUID createdById);
}
