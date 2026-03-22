package com.tempstaff.repository;

import com.tempstaff.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    List<Candidate> findByInterviewId(UUID interviewId);

    long countByInterviewId(UUID interviewId);
}
