package com.tempstaff.repository;

import com.tempstaff.entity.CandidateMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CandidateMarkRepository extends JpaRepository<CandidateMark, UUID> {
    List<CandidateMark> findBySessionId(UUID sessionId);
    List<CandidateMark> findBySessionIdAndCandidateId(UUID sessionId, UUID candidateId);
    void deleteBySessionIdAndCandidateIdAndMarkerId(UUID sessionId, UUID candidateId, UUID markerId);

    /** Remove marks that reference criteria on this scheme (needed before replacing a scheme). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM candidate_marks WHERE criterion_id IN (SELECT id FROM marking_criteria WHERE scheme_id = :schemeId)",
            nativeQuery = true)
    void deleteAllByMarkingSchemeId(@Param("schemeId") UUID schemeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM CandidateMark m WHERE m.marker.id = :userId")
    void deleteAllByMarkerId(@Param("userId") UUID userId);
}
