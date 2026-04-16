package com.tempstaff.repository;

import com.tempstaff.entity.JobDescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JobDescriptionRepository extends JpaRepository<JobDescription, UUID> {
    Optional<JobDescription> findByUser_Id(UUID userId);
}

