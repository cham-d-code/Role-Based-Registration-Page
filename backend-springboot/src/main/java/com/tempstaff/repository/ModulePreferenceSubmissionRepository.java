package com.tempstaff.repository;

import com.tempstaff.entity.ModulePreferenceSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;

public interface ModulePreferenceSubmissionRepository extends JpaRepository<ModulePreferenceSubmission, UUID> {
    Optional<ModulePreferenceSubmission> findByRequestIdAndStaffId(UUID requestId, UUID staffId);
    List<ModulePreferenceSubmission> findByStaffId(UUID staffId);
    List<ModulePreferenceSubmission> findByRequestIdAndStaffIdIn(UUID requestId, Collection<UUID> staffIds);
}

