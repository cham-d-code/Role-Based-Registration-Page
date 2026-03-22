package com.tempstaff.repository;

import com.tempstaff.entity.UserSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserSubjectRepository extends JpaRepository<UserSubject, UUID> {
}
