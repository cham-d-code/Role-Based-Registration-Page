package com.tempstaff.repository;

import com.tempstaff.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.token = :token " +
            "AND prt.expiresAt > :now AND prt.usedAt IS NULL")
    Optional<PasswordResetToken> findValidToken(String token, LocalDateTime now);

    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.usedAt = :usedAt WHERE prt.id = :id")
    void markAsUsed(UUID id, LocalDateTime usedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM PasswordResetToken p WHERE p.userId = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
