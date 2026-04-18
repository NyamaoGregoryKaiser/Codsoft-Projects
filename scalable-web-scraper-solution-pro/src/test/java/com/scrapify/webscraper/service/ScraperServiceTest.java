```java
package com.scrapify.webscraper.service;

import com.scrapify.webscraper.model.JobExecutionLog;
import com.scrapify.webscraper.model.JobStatus;
import com.scrapify.webscraper.model.Role;
import com.scrapify.webscraper.model.ScrapedData;
import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.model.User;
import com.scrapify.webscraper.repository.JobExecutionLogRepository;
import com.scrapify.webscraper.repository.ScrapedDataRepository;
import com.scrapify.webscraper.repository.ScrapingJobRepository;
import com.scrapify.webscraper.util.HtmlParser;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScraperServiceTest {

    @Mock
    private ScrapingJobRepository scrapingJobRepository;
    @Mock
    private ScrapedDataRepository scrapedDataRepository;
    @Mock
    private JobExecutionLogRepository jobExecutionLogRepository;
    @Mock
    private HtmlParser htmlParser;

    @InjectMocks
    private ScraperService scraperService;

    private User testUser;
    private ScrapingJob sampleJob;
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
                .config(Map.of("title", "h1", "description", "p"))
                .status(JobStatus.PENDING)
                .user(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testExecuteScrapingJob_Success() throws Exception {
        Document mockDocument = mock(Document.class);
        Map<String, String> extractedData = Map.of("title", "Example Domain", "description", "This domain is for use in illustrative examples.");

        when(scrapingJobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(jobExecutionLogRepository.save(any(JobExecutionLog.class)))
                .thenAnswer(invocation -> {
                    JobExecutionLog log = invocation.getArgument(0);
                    if (log.getId() == null) log.setId(UUID.randomUUID());
                    return log;
                });
        when(htmlParser.fetchDocument(sampleJob.getTargetUrl())).thenReturn(mockDocument);
        when(htmlParser.extractData(mockDocument, sampleJob.getConfig())).thenReturn(extractedData);
        when(scrapedDataRepository.save(any(ScrapedData.class)))
                .thenAnswer(invocation -> {
                    ScrapedData data = invocation.getArgument(0);
                    if (data.getId() == null) data.setId(UUID.randomUUID());
                    return data;
                });

        scraperService.executeScrapingJob(jobId);

        ArgumentCaptor<ScrapingJob> jobCaptor = ArgumentCaptor.forClass(ScrapingJob.class);
        ArgumentCaptor<JobExecutionLog> logCaptor = ArgumentCaptor.forClass(JobExecutionLog.class);
        ArgumentCaptor<ScrapedData> dataCaptor = ArgumentCaptor.forClass(ScrapedData.class);

        verify(scrapingJobRepository, times(2)).save(jobCaptor.capture()); // One for RUNNING, one for COMPLETED
        verify(jobExecutionLogRepository, times(2)).save(logCaptor.capture()); // One for RUNNING, one for COMPLETED
        verify(scrapedDataRepository, times(1)).save(dataCaptor.capture());

        // Verify initial job status update
        ScrapingJob initialJobState = jobCaptor.getAllValues().get(0);
        assertThat(initialJobState.getStatus()).isEqualTo(JobStatus.RUNNING);

        // Verify final job status update
        ScrapingJob finalJobState = jobCaptor.getAllValues().get(1);
        assertThat(finalJobState.getStatus()).isEqualTo(JobStatus.COMPLETED);
        assertThat(finalJobState.getLastRunAt()).isNotNull();

        // Verify initial log state
        JobExecutionLog initialLogState = logCaptor.getAllValues().get(0);
        assertThat(initialLogState.getStatus()).isEqualTo(JobStatus.RUNNING);
        assertThat(initialLogState.getStartTime()).isNotNull();

        // Verify final log state
        JobExecutionLog finalLogState = logCaptor.getAllValues().get(1);
        assertThat(finalLogState.getStatus()).isEqualTo(JobStatus.COMPLETED);
        assertThat(finalLogState.getEndTime()).isNotNull();
        assertThat(finalLogState.getDataCount()).isEqualTo(1);
        assertThat(finalLogState.getErrorMessage()).isNull();

        // Verify scraped data
        ScrapedData savedData = dataCaptor.getValue();
        assertThat(savedData.getData()).isEqualTo(extractedData);
        assertThat(savedData.getScrapedUrl()).isEqualTo(sampleJob.getTargetUrl());
        assertThat(savedData.getScrapingJob().getId()).isEqualTo(jobId);
    }

    @Test
    void testExecuteScrapingJob_Failure() throws Exception {
        String errorMessage = "Failed to fetch document";

        when(scrapingJobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(jobExecutionLogRepository.save(any(JobExecutionLog.class)))
                .thenAnswer(invocation -> {
                    JobExecutionLog log = invocation.getArgument(0);
                    if (log.getId() == null) log.setId(UUID.randomUUID());
                    return log;
                });
        doThrow(new RuntimeException(errorMessage)).when(htmlParser).fetchDocument(sampleJob.getTargetUrl());

        scraperService.executeScrapingJob(jobId);

        ArgumentCaptor<ScrapingJob> jobCaptor = ArgumentCaptor.forClass(ScrapingJob.class);
        ArgumentCaptor<JobExecutionLog> logCaptor = ArgumentCaptor.forClass(JobExecutionLog.class);

        verify(scrapingJobRepository, times(2)).save(jobCaptor.capture()); // One for RUNNING, one for FAILED
        verify(jobExecutionLogRepository, times(2)).save(logCaptor.capture()); // One for RUNNING, one for FAILED
        verify(scrapedDataRepository, never()).save(any(ScrapedData.class)); // No data should be saved on failure

        // Verify initial job status update
        ScrapingJob initialJobState = jobCaptor.getAllValues().get(0);
        assertThat(initialJobState.getStatus()).isEqualTo(JobStatus.RUNNING);

        // Verify final job status update
        ScrapingJob finalJobState = jobCaptor.getAllValues().get(1);
        assertThat(finalJobState.getStatus()).isEqualTo(JobStatus.FAILED);
        assertThat(finalJobState.getLastRunAt()).isNotNull();

        // Verify initial log state
        JobExecutionLog initialLogState = logCaptor.getAllValues().get(0);
        assertThat(initialLogState.getStatus()).isEqualTo(JobStatus.RUNNING);
        assertThat(initialLogState.getStartTime()).isNotNull();

        // Verify final log state
        JobExecutionLog finalLogState = logCaptor.getAllValues().get(1);
        assertThat(finalLogState.getStatus()).isEqualTo(JobStatus.FAILED);
        assertThat(finalLogState.getEndTime()).isNotNull();
        assertThat(finalLogState.getErrorMessage()).contains(errorMessage);
        assertThat(finalLogState.getDataCount()).isNull(); // No data collected
    }

    @Test
    void testExecuteScrapingJob_JobNotFound() {
        when(scrapingJobRepository.findById(jobId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> scraperService.executeScrapingJob(jobId));
        verify(jobExecutionLogRepository, never()).save(any(JobExecutionLog.class)); // Log shouldn't be created
        verify(scrapingJobRepository, never()).save(any(ScrapingJob.class)); // Job shouldn't be updated
    }
}
```