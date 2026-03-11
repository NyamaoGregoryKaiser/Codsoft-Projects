package com.dataviz.datavisualizationtool.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class VisualizationDTO {
    private Long id;
    @NotBlank
    private String title;
    private String description;
    @NotBlank
    private String type; // e.g., "BAR_CHART", "LINE_CHART"
    @NotNull
    private Long dataSourceId;
    private String dataSourceName;
    @NotBlank
    private String query; // SQL query or API path
    private String config; // JSON string for chart options
    @NotNull
    private Integer position;
    @NotNull
    private Integer sizeX;
    @NotNull
    private Integer sizeY;
    private Long dashboardId;
    private Long ownerId;
    private String ownerUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}