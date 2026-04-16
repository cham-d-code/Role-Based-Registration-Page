package com.tempstaff.repository;

import com.tempstaff.entity.Attendance;
import com.tempstaff.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    @Query("""
            select a.status, count(a)
            from Attendance a
            where a.userId = :userId
              and a.attendanceDate >= :from
              and a.attendanceDate < :toExclusive
            group by a.status
            """)
    List<Object[]> countByStatusInPeriod(
            @Param("userId") UUID userId,
            @Param("from") LocalDate from,
            @Param("toExclusive") LocalDate toExclusive
    );

    long countByUserIdAndAttendanceDateGreaterThanEqualAndAttendanceDateLessThanAndStatus(
            UUID userId,
            LocalDate from,
            LocalDate toExclusive,
            AttendanceStatus status
    );
}

