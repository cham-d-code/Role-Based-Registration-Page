package com.tempstaff.repository;

import com.tempstaff.entity.ModulePreferenceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ModulePreferenceRequestRepository extends JpaRepository<ModulePreferenceRequest, UUID> {
    Optional<ModulePreferenceRequest> findFirstByOrderByCreatedAtDesc();

    @Query("select r from ModulePreferenceRequest r where r.targetStaffId is null or r.targetStaffId = :staffId order by r.createdAt desc")
    List<ModulePreferenceRequest> findLatestForStaff(@Param("staffId") UUID staffId, Pageable pageable);
}

