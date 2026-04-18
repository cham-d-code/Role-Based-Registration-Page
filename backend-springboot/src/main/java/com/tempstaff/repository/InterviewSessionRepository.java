package com.tempstaff.repository;

import com.tempstaff.entity.InterviewSession;
import com.tempstaff.entity.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    Optional<InterviewSession> findByInterviewIdAndActiveTrue(UUID interviewId);

    Optional<InterviewSession> findFirstByActiveTrue();

    /** Live session tied to an interview that is still upcoming (excludes ended interviews). */
    Optional<InterviewSession> findFirstByActiveTrueAndInterview_StatusOrderByStartedAtDesc(InterviewStatus status);

    List<InterviewSession> findAllByActiveTrueAndInterview_Status(InterviewStatus status);

    Optional<InterviewSession> findTopByInterviewIdOrderByStartedAtDesc(UUID interviewId);
}
