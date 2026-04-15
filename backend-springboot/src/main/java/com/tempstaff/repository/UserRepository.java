package com.tempstaff.repository;

import com.tempstaff.entity.User;
import com.tempstaff.entity.UserRole;
import com.tempstaff.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(UserRole role);

    Optional<User> findByEmailAndRole(String email, UserRole role);

    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :lastLoginAt WHERE u.id = :userId")
    void updateLastLoginAt(UUID userId, LocalDateTime lastLoginAt);

    @Modifying
    @Query("UPDATE User u SET u.passwordHash = :passwordHash WHERE u.id = :userId")
    void updatePassword(UUID userId, String passwordHash);

    // Find all pending users with specific roles (mentor and staff)
    List<User> findByStatusAndRoleIn(UserStatus status, List<UserRole> roles);

    // Find pending users by specific role
    List<User> findByStatusAndRole(UserStatus status, UserRole role);

    // Find approved staff mentees for a mentor
    List<User> findByStatusAndRoleAndMentorId(UserStatus status, UserRole role, java.util.UUID mentorId);

    long countByStatusAndRoleAndMentorId(UserStatus status, UserRole role, java.util.UUID mentorId);

    // Update user status
    @Modifying
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :userId")
    void updateStatus(@Param("userId") UUID userId, @Param("status") UserStatus status);
}
