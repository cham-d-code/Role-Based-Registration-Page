package com.tempstaff.repository;

import com.tempstaff.entity.SalaryReport;
import com.tempstaff.entity.SalaryReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryReportRepository extends JpaRepository<SalaryReport, UUID> {
    List<SalaryReport> findByPeriodKeyOrderByUpdatedAtDesc(String periodKey);
    List<SalaryReport> findByStatusOrderByUpdatedAtDesc(SalaryReportStatus status);
    Optional<SalaryReport> findByStaffIdAndPeriodKey(UUID staffId, String periodKey);
}

