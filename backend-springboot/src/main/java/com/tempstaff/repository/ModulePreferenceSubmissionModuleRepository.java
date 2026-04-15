package com.tempstaff.repository;

import com.tempstaff.entity.ModulePreferenceSubmissionModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModulePreferenceSubmissionModuleRepository extends JpaRepository<ModulePreferenceSubmissionModule, UUID> {
    List<ModulePreferenceSubmissionModule> findBySubmissionId(UUID submissionId);
    void deleteBySubmissionId(UUID submissionId);
}

