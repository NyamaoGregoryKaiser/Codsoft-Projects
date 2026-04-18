```java
package com.scrapify.webscraper.dto;

import com.scrapify.webscraper.model.JobStatus;
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
public class JobExecutionLogResponse {
    private UUID id;
    private UUID jobId;
    private JobStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String errorMessage;
    private Integer dataCount;
}
```