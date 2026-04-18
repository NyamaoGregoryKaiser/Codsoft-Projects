```java
package com.scrapify.webscraper.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scraping_job")
public class ScrapingJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Job name cannot be empty")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Target URL cannot be empty")
    @Column(nullable = false)
    private String targetUrl;

    @NotNull(message = "Scraping configuration cannot be null")
    @JdbcTypeCode(SqlTypes.JSON) // Use JSON type for configuration map
    @Column(name = "config", columnDefinition = "jsonb") // PostgreSQL specific JSONB type
    private Map<String, String> config; // CSS selectors, XPath, etc. e.g., "title": "h1.product-title", "price": "span.price"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status; // E.g., PENDING, RUNNING, COMPLETED, FAILED

    @Column(name = "cron_schedule")
    private String cronSchedule; // Cron expression for scheduling, e.g., "0 0 * * * ?" for hourly

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "next_run_at")
    private LocalDateTime nextRunAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = JobStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```