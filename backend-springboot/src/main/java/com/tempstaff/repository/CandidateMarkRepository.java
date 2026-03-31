package com.tempstaff.repository;

import com.tempstaff.entity.CandidateMark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CandidateMarkRepository extends JpaRepository<CandidateMark, UUID> {
    List<CandidateMark> findBySessionId(UUID sessionId);
    List<CandidateMark> findBySessionIdAndCandidateId(UUID sessionId, UUID candidateId);
    void deleteBySessionIdAndCandidateIdAndMarkerId(UUID sessionId, UUID candidateId, UUID markerId);
}
