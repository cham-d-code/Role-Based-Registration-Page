package com.tempstaff.repository;

import com.tempstaff.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ModuleRepository extends JpaRepository<Module, UUID> {

    @Query("SELECT m FROM Module m WHERE LOWER(m.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Module> findByNameContainingIgnoreCase(String name);
}
