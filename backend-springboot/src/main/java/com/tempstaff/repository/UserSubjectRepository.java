package com.tempstaff.repository;

import com.tempstaff.entity.UserSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSubjectRepository extends JpaRepository<UserSubject, UUID> {

    List<UserSubject> findByUserIdAndIsPreferred(UUID userId, Boolean isPreferred);

    void deleteByUserIdAndIsPreferred(UUID userId, Boolean isPreferred);
}
