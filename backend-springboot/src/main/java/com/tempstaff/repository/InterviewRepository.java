package com.tempstaff.repository;

import com.tempstaff.entity.Interview;
import com.tempstaff.entity.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findAllByOrderByDateDesc();

    List<Interview> findByStatus(InterviewStatus status);
}
