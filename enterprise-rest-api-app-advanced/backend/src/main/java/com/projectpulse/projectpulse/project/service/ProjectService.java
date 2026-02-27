package com.projectpulse.projectpulse.project.service;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.project.dto.ProjectCreateDto;
import com.projectpulse.projectpulse.project.dto.ProjectDto;
import com.projectpulse.projectpulse.project.dto.ProjectUpdateDto;
import com.projectpulse.projectpulse.project.entity.Project;
import com.projectpulse.projectpulse.project.repository.ProjectRepository;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.repository.UserRepository;
import com.projectpulse.projectpulse.util.Mappers;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository; // To fetch the creating user

    @Transactional
    public ProjectDto createProject(ProjectCreateDto createDto) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (projectRepository.existsByName(createDto.getName())) {
            throw new IllegalArgumentException("Project with name '" + createDto.getName() + "' already exists.");
        }

        Project project = Mappers.toProjectEntity(createDto);
        project.setCreatedBy(currentUser);
        Project savedProject = projectRepository.save(project);
        return Mappers.toProjectDto(savedProject);
    }

    @Cacheable(value = "projects", key = "#id")
    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return Mappers.toProjectDto(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(Mappers::toProjectDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByCurrentUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        return projectRepository.findByCreatedBy_Id(currentUser.getId()).stream()
                .map(Mappers::toProjectDto)
                .collect(Collectors.toList());
    }

    @CachePut(value = "projects", key = "#id")
    @Transactional
    public ProjectDto updateProject(Long id, ProjectUpdateDto updateDto) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Check if the current user is the creator OR if the user is an ADMIN
        boolean isAdmin = currentUser.getRole().equals(User.Role.ADMIN);
        if (!Objects.equals(existingProject.getCreatedBy().getId(), currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to update this project.");
        }

        Optional.ofNullable(updateDto.getName()).ifPresent(name -> {
            if (!name.equals(existingProject.getName()) && projectRepository.existsByName(name)) {
                throw new IllegalArgumentException("Project with name '" + name + "' already exists.");
            }
            existingProject.setName(name);
        });
        Optional.ofNullable(updateDto.getDescription()).ifPresent(existingProject::setDescription);

        Project updatedProject = projectRepository.save(existingProject);
        return Mappers.toProjectDto(updatedProject);
    }

    @CacheEvict(value = {"projects", "tasks"}, key = "#id", allEntries = false)
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Only the creator or an ADMIN can delete a project
        boolean isAdmin = currentUser.getRole().equals(User.Role.ADMIN);
        if (!Objects.equals(project.getCreatedBy().getId(), currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to delete this project.");
        }

        projectRepository.delete(project);
    }
}