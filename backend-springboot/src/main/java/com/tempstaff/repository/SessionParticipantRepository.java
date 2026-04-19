package com.tempstaff.repository;

import com.tempstaff.entity.SessionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, UUID> {
    List<SessionParticipant> findBySessionId(UUID sessionId);
    Optional<SessionParticipant> findBySessionIdAndUserId(UUID sessionId, UUID userId);
    Optional<SessionParticipant> findBySession_Interview_IdAndSession_ActiveTrueAndUserId(UUID interviewId, UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM SessionParticipant p WHERE p.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
