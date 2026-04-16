package com.tempstaff.repository;

import com.tempstaff.entity.SalaryTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryTemplateRepository extends JpaRepository<SalaryTemplate, UUID> {
    Optional<SalaryTemplate> findByPeriodKey(String periodKey);
}

