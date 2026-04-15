package com.tempstaff.repository;

import com.tempstaff.entity.ModulePreferenceRequestModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModulePreferenceRequestModuleRepository extends JpaRepository<ModulePreferenceRequestModule, UUID> {
    List<ModulePreferenceRequestModule> findByRequestId(UUID requestId);
    void deleteByRequestId(UUID requestId);
}

