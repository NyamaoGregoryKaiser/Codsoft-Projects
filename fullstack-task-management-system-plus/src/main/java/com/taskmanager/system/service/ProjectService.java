package com.taskmanager.system.service;

import com.taskmanager.system.dto.project.ProjectDto;
import com.taskmanager.system.dto.project.ProjectRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProjectService {
    ProjectDto createProject(Long userId, ProjectRequest projectRequest);
    ProjectDto getProjectById(Long projectId);
    Page<ProjectDto> getAllProjects(Pageable pageable);
    List<ProjectDto> getProjectsByUserId(Long userId);
    ProjectDto updateProject(Long userId, Long projectId, ProjectRequest projectRequest);
    void deleteProject(Long userId, Long projectId);
}