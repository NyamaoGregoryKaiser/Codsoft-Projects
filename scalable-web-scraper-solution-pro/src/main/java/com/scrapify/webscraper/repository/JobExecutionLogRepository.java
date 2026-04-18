```java
package com.scrapify.webscraper.repository;

import com.scrapify.webscraper.model.JobExecutionLog;
import com.scrapify.webscraper.model.ScrapingJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobExecutionLogRepository extends JpaRepository<JobExecutionLog, UUID> {
    List<JobExecutionLog> findByScrapingJob(ScrapingJob job);
    Page<JobExecutionLog> findByScrapingJobId(UUID jobId, Pageable pageable);
}
```