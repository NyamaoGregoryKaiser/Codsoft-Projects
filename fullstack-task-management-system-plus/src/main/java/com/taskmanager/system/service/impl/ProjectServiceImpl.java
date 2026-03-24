package com.taskmanager.system.service.impl;

import com.taskmanager.system.dto.project.ProjectDto;
import com.taskmanager.system.dto.project.ProjectRequest;
import com.taskmanager.system.exception.ResourceNotFoundException;
import com.taskmanager.system.exception.TaskManagerException;
import com.taskmanager.system.model.Project;
import com.taskmanager.system.model.User;
import com.taskmanager.system.repository.ProjectRepository;
import com.taskmanager.system.repository.UserRepository;
import com.taskmanager.system.service.ProjectService;
import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private ProjectRepository projectRepository;
    private UserRepository userRepository;
    private ModelMapper modelMapper;

    @Override
    @Transactional
    public ProjectDto createProject(Long userId, ProjectRequest projectRequest) {
        if (projectRepository.existsByName(projectRequest.getName())) {
            throw new TaskManagerException(HttpStatus.BAD_REQUEST, "Project with name '" + projectRequest.getName() + "' already exists.");
        }

        User createdBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Project project = modelMapper.map(projectRequest, Project.class);
        project.setCreatedBy(createdBy);

        Project savedProject = projectRepository.save(project);
        return modelMapper.map(savedProject, ProjectDto.class);
    }

    @Override
    @Cacheable(value = "projects", key = "#projectId")
    public ProjectDto getProjectById(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        return modelMapper.map(project, ProjectDto.class);
    }

    @Override
    public Page<ProjectDto> getAllProjects(Pageable pageable) {
        Page<Project> projects = projectRepository.findAll(pageable);
        return projects.map(project -> modelMapper.map(project, ProjectDto.class));
    }

    @Override
    public List<ProjectDto> getProjectsByUserId(Long userId) {
        List<Project> projects = projectRepository.findByCreatedBy_Id(userId);
        return projects.stream()
                .map(project -> modelMapper.map(project, ProjectDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "projects", key = "#projectId") // Evict cache on update
    public ProjectDto updateProject(Long userId, Long projectId, ProjectRequest projectRequest) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (!project.getCreatedBy().getId().equals(userId)) {
            throw new TaskManagerException(HttpStatus.FORBIDDEN, "You are not authorized to update this project.");
        }
        
        // Check for unique name if changed
        if (!project.getName().equals(projectRequest.getName()) && projectRepository.existsByName(projectRequest.getName())) {
             throw new TaskManagerException(HttpStatus.BAD_REQUEST, "Project with name '" + projectRequest.getName() + "' already exists.");
        }

        project.setName(projectRequest.getName());
        project.setDescription(projectRequest.getDescription());

        Project updatedProject = projectRepository.save(project);
        return modelMapper.map(updatedProject, ProjectDto.class);
    }

    @Override
    @Transactional
    @CacheEvict(value = "projects", key = "#projectId") // Evict cache on delete
    public void deleteProject(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (!project.getCreatedBy().getId().equals(userId)) {
            throw new TaskManagerException(HttpStatus.FORBIDDEN, "You are not authorized to delete this project.");
        }

        projectRepository.delete(project);
    }
}