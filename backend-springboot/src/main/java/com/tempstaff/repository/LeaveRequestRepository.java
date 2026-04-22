package com.tempstaff.repository;

import com.tempstaff.entity.LeaveRequest;
import com.tempstaff.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByUser_Id(UUID userId);

    List<LeaveRequest> findByStatus(RequestStatus status);

    long countByUser_IdAndStatusAndStartDateBetween(UUID userId, RequestStatus status, LocalDate start, LocalDate end);

    boolean existsByUser_IdAndStartDateAndStatusIn(UUID userId, LocalDate startDate, Collection<RequestStatus> statuses);

    Optional<LeaveRequest> findFirstByUser_IdAndStartDateAndStatusInOrderByCreatedAtDesc(
            UUID userId,
            LocalDate startDate,
            Collection<RequestStatus> statuses
    );

    boolean existsBySubstitute_IdAndStartDateAndStatusIn(UUID substituteId, LocalDate startDate, Collection<RequestStatus> statuses);

    List<LeaveRequest> findAllByOrderByCreatedAtDesc();
}

