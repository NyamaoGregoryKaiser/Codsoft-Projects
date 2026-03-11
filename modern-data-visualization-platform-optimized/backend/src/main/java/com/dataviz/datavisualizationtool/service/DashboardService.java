package com.dataviz.datavisualizationtool.service;

import com.dataviz.datavisualizationtool.config.CacheConfig;
import com.dataviz.datavisualizationtool.dto.DashboardDTO;
import com.dataviz.datavisualizationtool.dto.VisualizationDTO;
import com.dataviz.datavisualizationtool.entity.Dashboard;
import com.dataviz.datavisualizationtool.entity.User;
import com.dataviz.datavisualizationtool.entity.Visualization;
import com.dataviz.datavisualizationtool.exception.ResourceNotFoundException;
import com.dataviz.datavisualizationtool.repository.DashboardRepository;
import com.dataviz.datavisualizationtool.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private DashboardRepository dashboardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VisualizationService visualizationService; // To convert nested visualizations

    @Cacheable(value = CacheConfig.DASHBOARD_CACHE, key = "#id")
    public DashboardDTO getDashboardById(Long id) {
        Dashboard dashboard = dashboardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard not found with id: " + id));
        return convertToDTO(dashboard);
    }

    public List<DashboardDTO> getAllDashboards() {
        return dashboardRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DashboardDTO> getDashboardsByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));
        return dashboardRepository.findByOwner(owner).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = CacheConfig.DASHBOARD_CACHE, allEntries = true)
    public DashboardDTO createDashboard(DashboardDTO dashboardDTO) {
        User owner = userRepository.findById(dashboardDTO.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + dashboardDTO.getOwnerId()));

        Dashboard dashboard = new Dashboard();
        dashboard.setTitle(dashboardDTO.getTitle());
        dashboard.setDescription(dashboardDTO.getDescription());
        dashboard.setOwner(owner);

        Dashboard savedDashboard = dashboardRepository.save(dashboard);

        // Handle nested visualizations (if any, typically added later)
        if (dashboardDTO.getVisualizations() != null && !dashboardDTO.getVisualizations().isEmpty()) {
            List<Visualization> visualizations = dashboardDTO.getVisualizations().stream()
                    .map(vizDTO -> {
                        Visualization viz = visualizationService.convertToEntity(vizDTO);
                        viz.setDashboard(savedDashboard); // Link to the new dashboard
                        viz.setOwner(owner); // Ensure owner is set for child viz
                        return viz;
                    })
                    .collect(Collectors.toList());
            savedDashboard.setVisualizations(visualizations);
            savedDashboard = dashboardRepository.save(savedDashboard); // Save again to persist visualizations
        }


        return convertToDTO(savedDashboard);
    }

    @Transactional
    @CachePut(value = CacheConfig.DASHBOARD_CACHE, key = "#id")
    @CacheEvict(value = CacheConfig.DASHBOARD_CACHE, allEntries = true, condition = "#result == null")
    public DashboardDTO updateDashboard(Long id, DashboardDTO dashboardDTO) {
        Dashboard existingDashboard = dashboardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard not found with id: " + id));

        existingDashboard.setTitle(dashboardDTO.getTitle());
        existingDashboard.setDescription(dashboardDTO.getDescription());

        // Optionally update owner
        if (dashboardDTO.getOwnerId() != null && !existingDashboard.getOwner().getId().equals(dashboardDTO.getOwnerId())) {
            User newOwner = userRepository.findById(dashboardDTO.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("New owner not found with id: " + dashboardDTO.getOwnerId()));
            existingDashboard.setOwner(newOwner);
        }

        // Note: For updating nested visualizations, you might need a more complex logic
        // that compares existing visualizations with the DTO list and performs add/update/delete.
        // For simplicity, this example only updates dashboard metadata.
        // To update visualizations, separate VisualizationController/Service calls are recommended.

        Dashboard updatedDashboard = dashboardRepository.save(existingDashboard);
        return convertToDTO(updatedDashboard);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.DASHBOARD_CACHE, key = "#id")
    public void deleteDashboard(Long id) {
        if (!dashboardRepository.existsById(id)) {
            throw new ResourceNotFoundException("Dashboard not found with id: " + id);
        }
        dashboardRepository.deleteById(id);
    }

    private DashboardDTO convertToDTO(Dashboard dashboard) {
        DashboardDTO dto = new DashboardDTO();
        dto.setId(dashboard.getId());
        dto.setTitle(dashboard.getTitle());
        dto.setDescription(dashboard.getDescription());
        dto.setOwnerId(dashboard.getOwner().getId());
        dto.setOwnerUsername(dashboard.getOwner().getUsername());
        dto.setCreatedAt(dashboard.getCreatedAt());
        dto.setUpdatedAt(dashboard.getUpdatedAt());

        // Eagerly load visualizations if needed for display, or make a separate API call
        if (dashboard.getVisualizations() != null) {
            dto.setVisualizations(dashboard.getVisualizations().stream()
                    .map(visualizationService::convertToDTO)
                    .collect(Collectors.toList()));
        } else {
            dto.setVisualizations(Collections.emptyList());
        }
        return dto;
    }

    // No convertToEntity for Dashboard for simplicity, as it can contain nested visualizations which require more complex mapping.
    // A dedicated mapper (e.g., MapStruct) would handle this elegantly.
}