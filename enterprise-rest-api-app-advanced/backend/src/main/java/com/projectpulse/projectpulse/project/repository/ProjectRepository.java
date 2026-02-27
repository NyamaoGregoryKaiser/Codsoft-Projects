package com.projectpulse.projectpulse.project.repository;

import com.projectpulse.projectpulse.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreatedBy_Id(Long userId);
    boolean existsByName(String name);
}