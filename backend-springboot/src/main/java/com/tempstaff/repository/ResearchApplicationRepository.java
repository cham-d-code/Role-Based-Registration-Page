package com.tempstaff.repository;

import com.tempstaff.entity.ResearchApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResearchApplicationRepository extends JpaRepository<ResearchApplication, UUID> {
    boolean existsByOpportunityIdAndUserId(UUID opportunityId, UUID userId);

    List<ResearchApplication> findByOpportunityIdOrderByAppliedAtDesc(UUID opportunityId);

    List<ResearchApplication> findByUserIdOrderByAppliedAtDesc(UUID userId);

    Optional<ResearchApplication> findByIdAndUserId(UUID id, UUID userId);
}

