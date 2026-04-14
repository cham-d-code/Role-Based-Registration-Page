package com.tempstaff.repository;

import com.tempstaff.entity.ResearchOpportunity;
import com.tempstaff.entity.ResearchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResearchOpportunityRepository extends JpaRepository<ResearchOpportunity, UUID> {
    List<ResearchOpportunity> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);

    List<ResearchOpportunity> findByStatusOrderByCreatedAtDesc(ResearchStatus status);
}

