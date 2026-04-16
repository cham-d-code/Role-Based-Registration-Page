package com.tempstaff.repository;

import com.tempstaff.entity.LeaveRequest;
import com.tempstaff.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByUser_Id(UUID userId);

    List<LeaveRequest> findByStatus(RequestStatus status);
}

