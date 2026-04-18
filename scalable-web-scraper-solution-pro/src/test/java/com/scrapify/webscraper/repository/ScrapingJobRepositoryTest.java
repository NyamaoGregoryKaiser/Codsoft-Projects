```java
package com.scrapify.webscraper.repository;

import com.scrapify.webscraper.model.JobStatus;
import com.scrapify.webscraper.model.Role;
import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Use a real DB (Testcontainers for example)
@ActiveProfiles("test")
public class ScrapingJobRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ScrapingJobRepository scrapingJobRepository;

    @Autowired
    private UserRepository userRepository; // To persist users for job relationships

    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        // Clear database before each test to ensure isolated tests
        scrapingJobRepository.deleteAll();
        userRepository.deleteAll();

        testUser = User.builder()
                .username("testuser")
                .password("password")
                .email("test@example.com")
                .roles(Set.of(Role.USER))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(testUser);

        anotherUser = User.builder()
                .username("anotheruser")
                .password("password")
                .email("another@example.com")
                .roles(Set.of(Role.USER))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(anotherUser);
    }

    @Test
    void testSaveScrapingJob() {
        ScrapingJob job = ScrapingJob.builder()
                .name("Test Job")
                .targetUrl("http://example.com")
                .config(Map.of("title", "h1"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .build();

        ScrapingJob savedJob = scrapingJobRepository.save(job);

        assertThat(savedJob).isNotNull();
        assertThat(savedJob.getId()).isNotNull();
        assertThat(savedJob.getName()).isEqualTo("Test Job");
        assertThat(savedJob.getCreatedAt()).isNotNull();
        assertThat(savedJob.getUpdatedAt()).isNotNull();
        assertThat(savedJob.getUser().getId()).isEqualTo(testUser.getId());
    }

    @Test
    void testFindByIdAndUser() {
        ScrapingJob job = ScrapingJob.builder()
                .name("User Specific Job")
                .targetUrl("http://specific.com")
                .config(Map.of("data", "div"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .build();
        entityManager.persistAndFlush(job);

        Optional<ScrapingJob> foundJob = scrapingJobRepository.findByIdAndUser(job.getId(), testUser);
        assertThat(foundJob).isPresent();
        assertThat(foundJob.get().getName()).isEqualTo("User Specific Job");

        Optional<ScrapingJob> notFoundJob = scrapingJobRepository.findByIdAndUser(job.getId(), anotherUser);
        assertThat(notFoundJob).isNotPresent();
    }

    @Test
    void testFindByUser() {
        ScrapingJob job1 = ScrapingJob.builder()
                .name("Job 1 for Test User")
                .targetUrl("http://site1.com")
                .config(Map.of("data", "p"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .build();
        entityManager.persistAndFlush(job1);

        ScrapingJob job2 = ScrapingJob.builder()
                .name("Job 2 for Test User")
                .targetUrl("http://site2.com")
                .config(Map.of("data", "span"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .build();
        entityManager.persistAndFlush(job2);

        ScrapingJob job3 = ScrapingJob.builder()
                .name("Job for Another User")
                .targetUrl("http://site3.com")
                .config(Map.of("data", "h2"))
                .status(JobStatus.PENDING)
                .user(anotherUser)
                .build();
        entityManager.persistAndFlush(job3);

        List<ScrapingJob> testUserJobs = scrapingJobRepository.findByUser(testUser);
        assertThat(testUserJobs).hasSize(2);
        assertThat(testUserJobs).extracting(ScrapingJob::getName)
                .containsExactlyInAnyOrder("Job 1 for Test User", "Job 2 for Test User");
    }

    @Test
    void testFindByCronScheduleIsNotNull() {
        ScrapingJob scheduledJob = ScrapingJob.builder()
                .name("Scheduled Job")
                .targetUrl("http://scheduled.com")
                .config(Map.of("data", "body"))
                .status(JobStatus.PENDING)
                .cronSchedule("0 0 12 * * ?") // Noon every day
                .user(testUser)
                .build();
        entityManager.persistAndFlush(scheduledJob);

        ScrapingJob unscheduledJob = ScrapingJob.builder()
                .name("Unscheduled Job")
                .targetUrl("http://unscheduled.com")
                .config(Map.of("data", "body"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .build();
        entityManager.persistAndFlush(unscheduledJob);

        List<ScrapingJob> jobsWithSchedule = scrapingJobRepository.findByCronScheduleIsNotNull();
        assertThat(jobsWithSchedule).hasSize(1);
        assertThat(jobsWithSchedule.get(0).getName()).isEqualTo("Scheduled Job");
    }

    // You can add more tests for update, delete, etc.
}
```