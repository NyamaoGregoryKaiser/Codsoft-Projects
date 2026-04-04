package com.example.secureprojectmanagement.service;

import com.example.secureprojectmanagement.exception.ResourceNotFoundException;
import com.example.secureprojectmanagement.model.Project;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.repository.ProjectRepository;
import com.example.secureprojectmanagement.web.dto.ProjectDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CustomUserDetailsService userDetailsService; // To fetch user details

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Cacheable(value = "projects", key = "'allProjects'")
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @projectService.isProjectOwner(#id, authentication.principal.id)")
    @Cacheable(value = "projects", key = "#id")
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @CacheEvict(value = "projects", allEntries = true) // Evict all cache entries for projects on create
    public Project createProject(ProjectDTO projectDTO, Long ownerId) {
        User owner = userDetailsService.loadUserById(ownerId);

        Project project = new Project();
        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        project.setStartDate(projectDTO.getStartDate());
        project.setEndDate(projectDTO.getEndDate());
        project.setOwner(owner);
        return projectRepository.save(project);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and @projectService.isProjectOwner(#id, authentication.principal.id)")
    @CachePut(value = "projects", key = "#id") // Update cache entry for the specific project
    public Project updateProject(Long id, ProjectDTO projectDTO) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        project.setStartDate(projectDTO.getStartDate());
        project.setEndDate(projectDTO.getEndDate());
        return projectRepository.save(project);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN') or (@projectService.isProjectOwner(#id, authentication.principal.id))")
    @CacheEvict(value = "projects", key = "#id") // Evict specific project from cache
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    // Helper method for authorization (used in @PreAuthorize)
    public boolean isProjectOwner(Long projectId, Long userId) {
        return projectRepository.findById(projectId)
                .map(project -> project.getOwner().getId().equals(userId))
                .orElse(false);
    }
}