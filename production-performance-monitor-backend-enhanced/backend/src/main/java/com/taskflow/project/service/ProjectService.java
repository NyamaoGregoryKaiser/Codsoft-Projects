```java
package com.taskflow.project.service;

import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.project.dto.ProjectDTO;
import com.taskflow.project.model.Project;
import com.taskflow.project.repository.ProjectRepository;
import com.taskflow.user.model.User;
import com.taskflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "projects", key = "#id")
    public Project getProjectById(UUID id) {
        log.debug("Fetching project by ID: {}", id);
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "projects", key = "'allProjects'")
    public List<Project> getAllProjects() {
        log.debug("Fetching all projects.");
        return projectRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Project> getAllProjectsPaged(Pageable pageable) {
        log.debug("Fetching all projects with pagination: {}", pageable);
        return projectRepository.findAll(pageable);
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true) // Clear all project caches on creation
    public Project createProject(ProjectDTO projectDTO, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with ID: " + ownerId));

        Project project = Project.builder()
                .name(projectDTO.getName())
                .description(projectDTO.getDescription())
                .owner(owner)
                .build();

        project = projectRepository.save(project);
        log.info("Project created: {} by user {}", project.getName(), owner.getUsername());
        return project;
    }

    @Transactional
    @CacheEvict(value = "projects", key = "#id") // Evict specific project on update
    public Project updateProject(UUID id, ProjectDTO projectDTO) {
        Project existingProject = getProjectById(id);

        existingProject.setName(projectDTO.getName());
        existingProject.setDescription(projectDTO.getDescription());

        Project updatedProject = projectRepository.save(existingProject);
        log.info("Project updated: {}", updatedProject.getName());
        return updatedProject;
    }

    @Transactional
    @CacheEvict(value = "projects", key = "#id") // Evict specific project on deletion
    public void deleteProject(UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with ID: " + id);
        }
        projectRepository.deleteById(id);
        log.info("Project deleted with ID: {}", id);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "projects", key = "'byOwner:' + #ownerId")
    public List<Project> getProjectsByOwner(UUID ownerId) {
        log.debug("Fetching projects for owner ID: {}", ownerId);
        return projectRepository.findByOwnerId(ownerId);
    }
}
```