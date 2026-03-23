```java
package com.tasksyncpro.tasksyncpro.service;

import com.tasksyncpro.tasksyncpro.dto.ProjectDto;
import com.tasksyncpro.tasksyncpro.entity.Project;
import com.tasksyncpro.tasksyncpro.entity.User;
import com.tasksyncpro.tasksyncpro.exception.ResourceNotFoundException;
import com.tasksyncpro.tasksyncpro.repository.ProjectRepository;
import com.tasksyncpro.tasksyncpro.repository.UserRepository;
import com.tasksyncpro.tasksyncpro.util.PerformanceMonitorAspect;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MetricsService metricsService;

    private ProjectDto mapToDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setOwnerId(project.getOwner().getId());
        dto.setOwnerUsername(project.getOwner().getUsername());
        dto.setMemberIds(project.getMembers().stream().map(User::getId).collect(Collectors.toList()));
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }

    @Transactional
    @PerformanceMonitorAspect.MonitorPerformance
    public ProjectDto createProject(ProjectDto projectDto) {
        log.info("Creating new project: {}", projectDto.getName());
        User owner = userRepository.findById(projectDto.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + projectDto.getOwnerId()));

        Project project = new Project();
        project.setName(projectDto.getName());
        project.setDescription(projectDto.getDescription());
        project.setOwner(owner);

        // Add owner as a member by default
        project.getMembers().add(owner);
        if (projectDto.getMemberIds() != null) {
            projectDto.getMemberIds().forEach(memberId -> {
                if (!memberId.equals(owner.getId())) { // Avoid adding owner twice
                    userRepository.findById(memberId).ifPresent(project::addMember);
                }
            });
        }

        Project savedProject = projectRepository.save(project);
        log.info("Project created with ID: {}", savedProject.getId());
        metricsService.incrementProjectCreatedCounter();
        return mapToDto(savedProject);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "projects", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public ProjectDto getProjectById(Long id) {
        log.debug("Fetching project by ID: {}", id);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToDto(project);
    }

    @Transactional(readOnly = true)
    @PerformanceMonitorAspect.MonitorPerformance
    public Page<ProjectDto> getAllProjects(Pageable pageable) {
        log.debug("Fetching all projects, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return projectRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    @PerformanceMonitorAspect.MonitorPerformance
    public List<ProjectDto> getProjectsByOwner(Long ownerId) {
        log.debug("Fetching projects by owner ID: {}", ownerId);
        return projectRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "projects", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public ProjectDto updateProject(Long id, ProjectDto projectDto) {
        log.info("Updating project with ID: {}", id);
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        existingProject.setName(projectDto.getName());
        existingProject.setDescription(projectDto.getDescription());

        // Handle members update
        if (projectDto.getMemberIds() != null) {
            Set<User> updatedMembers = new HashSet<>();
            for (Long memberId : projectDto.getMemberIds()) {
                userRepository.findById(memberId)
                        .ifPresent(updatedMembers::add);
            }
            existingProject.setMembers(updatedMembers);
        }

        Project updatedProject = projectRepository.save(existingProject);
        log.info("Project updated: {}", updatedProject.getName());
        return mapToDto(updatedProject);
    }

    @Transactional
    @CacheEvict(value = "projects", key = "#id")
    @PerformanceMonitorAspect.MonitorPerformance
    public void deleteProject(Long id) {
        log.warn("Deleting project with ID: {}", id);
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
        log.info("Project with ID {} deleted.", id);
        metricsService.decrementProjectCountGauge(); // Example: if using a Gauge
    }
}
```