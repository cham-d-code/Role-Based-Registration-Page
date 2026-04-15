package com.tempstaff.repository;

import com.tempstaff.entity.ModulePreferenceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ModulePreferenceRequestRepository extends JpaRepository<ModulePreferenceRequest, UUID> {
    Optional<ModulePreferenceRequest> findFirstByOrderByCreatedAtDesc();
}

