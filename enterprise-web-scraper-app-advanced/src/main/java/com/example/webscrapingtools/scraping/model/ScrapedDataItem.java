package com.example.webscrapingtools.scraping.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scraped_data_item")
public class ScrapedDataItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scraping_task_id", nullable = false)
    private ScrapingTask scrapingTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scraper_definition_id", nullable = false)
    private ScraperDefinition scraperDefinition;

    @JdbcTypeCode(SqlTypes.JSON) // For PostgreSQL JSONB support
    @Column(columnDefinition = "jsonb")
    private Map<String, String> data; // Stores key-value pairs of scraped data

    @Column(nullable = false, updatable = false)
    private LocalDateTime scrapedAt;

    @PrePersist
    protected void onCreate() {
        this.scrapedAt = LocalDateTime.now();
    }
}