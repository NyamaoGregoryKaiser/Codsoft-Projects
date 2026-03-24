package com.taskmanager.system.repository;

import com.taskmanager.system.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreatedBy_Id(Long userId);
    boolean existsByName(String name);
}