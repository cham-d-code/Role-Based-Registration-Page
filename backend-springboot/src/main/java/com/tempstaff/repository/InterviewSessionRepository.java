package com.tempstaff.repository;

import com.tempstaff.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    Optional<InterviewSession> findByInterviewIdAndActiveTrue(UUID interviewId);
    Optional<InterviewSession> findFirstByActiveTrue();
}
