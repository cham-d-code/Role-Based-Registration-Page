package com.tempstaff.repository;

import com.tempstaff.entity.WeeklyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WeeklyTaskRepository extends JpaRepository<WeeklyTask, UUID> {
    List<WeeklyTask> findByUserIdOrderByDayOfWeekAscTimeFromAsc(UUID userId);
    void deleteByUserId(UUID userId);
}
