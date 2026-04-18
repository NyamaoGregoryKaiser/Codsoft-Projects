```java
package com.scrapify.webscraper.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "job_execution_log")
public class JobExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private ScrapingJob scrapingJob;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status; // PENDING, RUNNING, COMPLETED, FAILED

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "error_message", length = 2048)
    private String errorMessage;

    @Column(name = "data_count")
    private Integer dataCount;

    @PrePersist
    protected void onCreate() {
        this.startTime = LocalDateTime.now();
    }
}
```