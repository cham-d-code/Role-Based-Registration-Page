package com.tempstaff.repository;

import com.tempstaff.entity.UserSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSubjectRepository extends JpaRepository<UserSubject, UUID> {

    List<UserSubject> findByUserIdAndIsPreferred(UUID userId, Boolean isPreferred);

    void deleteByUserIdAndIsPreferred(UUID userId, Boolean isPreferred);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserSubject us WHERE us.userId = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
