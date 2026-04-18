```java
package com.scrapify.webscraper.service;

import com.scrapify.webscraper.dto.ScrapedDataResponse;
import com.scrapify.webscraper.dto.ScrapingJobRequest;
import com.scrapify.webscraper.dto.ScrapingJobResponse;
import com.scrapify.webscraper.exception.ResourceNotFoundException;
import com.scrapify.webscraper.model.JobExecutionLog;
import com.scrapify.webscraper.model.JobStatus;
import com.scrapify.webscraper.model.Role;
import com.scrapify.webscraper.model.ScrapedData;
import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.model.User;
import com.scrapify.webscraper.repository.JobExecutionLogRepository;
import com.scrapify.webscraper.repository.ScrapedDataRepository;
import com.scrapify.webscraper.repository.ScrapingJobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScrapingJobServiceTest {

    @Mock
    private ScrapingJobRepository scrapingJobRepository;
    @Mock
    private ScrapedDataRepository scrapedDataRepository;
    @Mock
    private JobExecutionLogRepository jobExecutionLogRepository;
    @Mock
    private SchedulerService schedulerService;

    @InjectMocks
    private ScrapingJobService scrapingJobService;

    private User testUser;
    private ScrapingJob sampleJob;
    private ScrapingJobRequest sampleJobRequest;
    private UUID jobId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .password("encodedpassword")
                .email("test@example.com")
                .roles(Set.of(Role.USER))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleJob = ScrapingJob.builder()
                .id(jobId)
                .name("Sample Job")
                .targetUrl("http://example.com")
                .config(Map.of("title", "h1"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleJobRequest = new ScrapingJobRequest();
        sampleJobRequest.setName("New Job");
        sampleJobRequest.setTargetUrl("http://newsite.com");
        sampleJobRequest.setConfig(Map.of("content", "div.main"));
        sampleJobRequest.setCronSchedule("0 0 1 * * ?");

        // Set up security context for PreAuthorize tests
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser.getUsername(), testUser.getPassword(), testUser.getAuthorities())
        );
    }

    @Test
    void testCreateScrapingJob() {
        when(scrapingJobRepository.save(any(ScrapingJob.class))).thenReturn(sampleJob);

        ScrapingJobResponse response = scrapingJobService.createScrapingJob(sampleJobRequest, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo(sampleJobRequest.getName());
        assertThat(response.getTargetUrl()).isEqualTo(sampleJobRequest.getTargetUrl());
        assertThat(response.getConfig()).isEqualTo(sampleJobRequest.getConfig());
        assertThat(response.getCreatedByUsername()).isEqualTo(testUser.getUsername());
        verify(scrapingJobRepository, times(1)).save(any(ScrapingJob.class));
        verify(schedulerService, times(1)).scheduleJob(any(ScrapingJob.class));
    }

    @Test
    void testGetScrapingJobById_Success() {
        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.of(sampleJob));

        ScrapingJobResponse response = scrapingJobService.getScrapingJobById(jobId, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(jobId);
        assertThat(response.getName()).isEqualTo(sampleJob.getName());
    }

    @Test
    void testGetScrapingJobById_NotFound() {
        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> scrapingJobService.getScrapingJobById(jobId, testUser));
    }

    @Test
    void testGetAllScrapingJobsForUser() {
        when(scrapingJobRepository.findByUser(testUser)).thenReturn(List.of(sampleJob));

        List<ScrapingJobResponse> responses = scrapingJobService.getAllScrapingJobsForUser(testUser);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(jobId);
    }

    @Test
    void testUpdateScrapingJob_Success() {
        ScrapingJob updatedJob = ScrapingJob.builder()
                .id(jobId)
                .name("Updated Job")
                .targetUrl("http://updated.com")
                .config(Map.of("new_field", "body"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .cronSchedule("0 0 2 * * ?")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.of(sampleJob));
        when(scrapingJobRepository.save(any(ScrapingJob.class))).thenReturn(updatedJob);

        ScrapingJobResponse response = scrapingJobService.updateScrapingJob(jobId, sampleJobRequest, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("New Job"); // Reflects request
        assertThat(response.getTargetUrl()).isEqualTo("http://newsite.com");
        verify(scrapingJobRepository, times(1)).save(any(ScrapingJob.class));
        verify(schedulerService, times(1)).rescheduleJob(any(ScrapingJob.class));
    }

    @Test
    void testUpdateScrapingJob_NotFound() {
        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> scrapingJobService.updateScrapingJob(jobId, sampleJobRequest, testUser));
    }

    @Test
    void testDeleteScrapingJob_Success() {
        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.of(sampleJob));
        doNothing().when(schedulerService).unscheduleJob(jobId);
        doNothing().when(scrapedDataRepository).deleteByScrapingJobId(jobId);
        doNothing().when(jobExecutionLogRepository).deleteByScrapingJob(sampleJob);
        doNothing().when(scrapingJobRepository).delete(sampleJob);

        scrapingJobService.deleteScrapingJob(jobId, testUser);

        verify(scrapingJobRepository, times(1)).findByIdAndUser(jobId, testUser);
        verify(schedulerService, times(1)).unscheduleJob(jobId);
        verify(scrapedDataRepository, times(1)).deleteByScrapingJobId(jobId);
        verify(jobExecutionLogRepository, times(1)).deleteByScrapingJob(sampleJob);
        verify(scrapingJobRepository, times(1)).delete(sampleJob);
    }

    @Test
    void testDeleteScrapingJob_NotFound() {
        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> scrapingJobService.deleteScrapingJob(jobId, testUser));
    }

    @Test
    void testGetScrapedDataForJob() {
        ScrapedData scrapedData = ScrapedData.builder()
                .id(UUID.randomUUID())
                .scrapingJob(sampleJob)
                .data(Map.of("field", "value"))
                .scrapedUrl("http://example.com")
                .scrapedAt(LocalDateTime.now())
                .build();
        Page<ScrapedData> dataPage = new PageImpl<>(List.of(scrapedData));

        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.of(sampleJob));
        when(scrapedDataRepository.findByScrapingJobId(eq(jobId), any(Pageable.class))).thenReturn(dataPage);

        Page<ScrapedDataResponse> responsePage = scrapingJobService.getScrapedDataForJob(jobId, testUser, 0, 10);

        assertThat(responsePage).isNotNull();
        assertThat(responsePage.getTotalElements()).isEqualTo(1);
        assertThat(responsePage.getContent().get(0).getData()).isEqualTo(scrapedData.getData());
        verify(scrapedDataRepository, times(1)).findByScrapingJobId(eq(jobId), any(Pageable.class));
    }

    @Test
    void testGetJobExecutionLogs() {
        JobExecutionLog logEntry = JobExecutionLog.builder()
                .id(UUID.randomUUID())
                .scrapingJob(sampleJob)
                .status(JobStatus.COMPLETED)
                .startTime(LocalDateTime.now().minusMinutes(5))
                .endTime(LocalDateTime.now())
                .dataCount(1)
                .build();
        Page<JobExecutionLog> logPage = new PageImpl<>(List.of(logEntry));

        when(scrapingJobRepository.findByIdAndUser(jobId, testUser)).thenReturn(Optional.of(sampleJob));
        when(jobExecutionLogRepository.findByScrapingJobId(eq(jobId), any(Pageable.class))).thenReturn(logPage);

        Page<JobExecutionLogResponse> responsePage = scrapingJobService.getJobExecutionLogs(jobId, testUser, 0, 10);

        assertThat(responsePage).isNotNull();
        assertThat(responsePage.getTotalElements()).isEqualTo(1);
        assertThat(responsePage.getContent().get(0).getStatus()).isEqualTo(JobStatus.COMPLETED);
        verify(jobExecutionLogRepository, times(1)).findByScrapingJobId(eq(jobId), any(Pageable.class));
    }

    @Test
    void testIsJobOwner() {
        when(scrapingJobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        assertThat(scrapingJobService.isJobOwner(jobId, "testuser")).isTrue();
        assertThat(scrapingJobService.isJobOwner(jobId, "anotheruser")).isFalse();
        when(scrapingJobRepository.findById(any(UUID.class))).thenReturn(Optional.empty());
        assertThat(scrapingJobService.isJobOwner(UUID.randomUUID(), "testuser")).isFalse();
    }
}
```