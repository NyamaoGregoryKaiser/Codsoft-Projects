package com.etms.backend.service;

import com.etms.backend.dto.ProjectDTO;
import com.etms.backend.dto.TaskDTO;
import com.etms.backend.exception.ResourceNotFoundException;
import com.etms.backend.model.Project;
import com.etms.backend.model.User;
import com.etms.backend.repository.ProjectRepository;
import com.etms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskService taskService; // Inject TaskService to convert tasks

    public ProjectDTO toProjectDTO(Project project) {
        List<TaskDTO> taskDTOS = project.getTasks() != null ? project.getTasks().stream()
                .map(taskService::toTaskDTO)
                .collect(Collectors.toList()) : null;

        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdById(project.getCreatedBy().getId())
                .createdByUsername(project.getCreatedBy().getUsername())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .tasks(taskDTOS)
                .build();
    }

    @Cacheable(value = "projects")
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toProjectDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "projectById", key = "#id")
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return toProjectDTO(project);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects", allEntries = true),
            @CacheEvict(value = "projectById", key = "#result.id")
    })
    public ProjectDTO createProject(ProjectDTO projectDTO, Long createdById) {
        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + createdById));

        Project project = Project.builder()
                .name(projectDTO.getName())
                .description(projectDTO.getDescription())
                .createdBy(createdBy)
                .build();

        return toProjectDTO(projectRepository.save(project));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects", allEntries = true),
            @CacheEvict(value = "projectById", key = "#id")
    })
    public ProjectDTO updateProject(Long id, ProjectDTO projectDTO) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        existingProject.setName(projectDTO.getName());
        existingProject.setDescription(projectDTO.getDescription());
        // createdBy should not be changed via update
        return toProjectDTO(projectRepository.save(existingProject));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projects", allEntries = true),
            @CacheEvict(value = "projectById", key = "#id")
    })
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }
}