package com.dataviz.datavisualizationtool.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "visualizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visualization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String type; // e.g., "BAR_CHART", "LINE_CHART", "PIE_CHART", "TABLE"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_source_id", nullable = false)
    private DataSource dataSource;

    @Column(columnDefinition = "TEXT")
    private String query; // SQL query or API path/body

    @Column(columnDefinition = "TEXT")
    private String config; // JSON string with chart specific configurations (e.g., axes, colors, labels)

    @Column(nullable = false)
    private Integer position; // Order/position on the dashboard

    @Column(nullable = false)
    private Integer sizeX; // Width on dashboard grid
    @Column(nullable = false)
    private Integer sizeY; // Height on dashboard grid

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dashboard_id", nullable = false)
    private Dashboard dashboard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}