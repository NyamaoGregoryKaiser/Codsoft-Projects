```java
package com.scrapify.webscraper.repository;

import com.scrapify.webscraper.model.ScrapedData;
import com.scrapify.webscraper.model.ScrapingJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScrapedDataRepository extends JpaRepository<ScrapedData, UUID> {
    List<ScrapedData> findByScrapingJob(ScrapingJob job);
    Page<ScrapedData> findByScrapingJobId(UUID jobId, Pageable pageable);
    void deleteByScrapingJobId(UUID jobId);
}
```