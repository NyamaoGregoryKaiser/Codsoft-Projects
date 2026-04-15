package com.example.webscrapingtools.scraping.model;

import com.example.webscrapingtools.auth.model.User;
import jakarta.persistence.*;
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
@Table(name = "scraping_task")
public class ScrapingTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scraper_definition_id", nullable = false)
    private ScraperDefinition scraperDefinition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScrapingStatus status;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String errorMessage; // Stores error message if status is FAILED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by_user_id") // Can be null if scheduled
    private User executedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt; // Record creation of task entry

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}