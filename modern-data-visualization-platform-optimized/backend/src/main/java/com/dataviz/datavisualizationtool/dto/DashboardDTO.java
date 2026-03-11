package com.dataviz.datavisualizationtool.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DashboardDTO {
    private Long id;
    @NotBlank
    private String title;
    private String description;
    private Long ownerId;
    private String ownerUsername;
    private List<VisualizationDTO> visualizations; // Nested visualizations for full dashboard view
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}