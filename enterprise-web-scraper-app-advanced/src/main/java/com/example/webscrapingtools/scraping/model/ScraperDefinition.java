package com.example.webscrapingtools.scraping.model;

import com.example.webscrapingtools.auth.model.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scraper_definition")
public class ScraperDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Scraper name cannot be empty")
    @Column(nullable = false, unique = true)
    private String name;

    @NotBlank(message = "Target URL cannot be empty")
    @Column(nullable = false)
    private String targetUrl;

    @NotBlank(message = "CSS Selector for items cannot be empty")
    @Column(nullable = false)
    private String itemCssSelector; // e.g., ".product-card"

    @Column(columnDefinition = "TEXT")
    private String fieldDefinitionsJson; // JSON string for { "fieldName": "cssSelector", ... }

    @Min(value = 0, message = "Schedule interval must be positive or 0 for manual only")
    private Integer scheduleIntervalMinutes; // 0 for manual, >0 for scheduled

    private boolean active = true;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}