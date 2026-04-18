```java
package com.scrapify.webscraper.repository;

import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScrapingJobRepository extends JpaRepository<ScrapingJob, UUID> {
    List<ScrapingJob> findByUser(User user);
    Optional<ScrapingJob> findByIdAndUser(UUID id, User user);
    List<ScrapingJob> findByCronScheduleIsNotNull(); // For scheduler to find jobs
}
```