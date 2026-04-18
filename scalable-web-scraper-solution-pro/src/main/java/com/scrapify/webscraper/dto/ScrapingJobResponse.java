```java
package com.scrapify.webscraper.dto;

import com.scrapify.webscraper.model.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapingJobResponse {
    private UUID id;
    private String name;
    private String targetUrl;
    private Map<String, String> config;
    private JobStatus status;
    private String cronSchedule;
    private LocalDateTime lastRunAt;
    private LocalDateTime nextRunAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByUsername;
}
```