```java
package com.scrapify.webscraper.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrapify.webscraper.config.JwtAuthFilter;
import com.scrapify.webscraper.config.JwtUtil;
import com.scrapify.webscraper.config.SecurityConfig;
import com.scrapify.webscraper.dto.ScrapedDataResponse;
import com.scrapify.webscraper.dto.ScrapingJobRequest;
import com.scrapify.webscraper.dto.ScrapingJobResponse;
import com.scrapify.webscraper.exception.GlobalExceptionHandler;
import com.scrapify.webscraper.exception.ResourceNotFoundException;
import com.scrapify.webscraper.model.JobStatus;
import com.scrapify.webscraper.model.Role;
import com.scrapify.webscraper.model.User;
import com.scrapify.webscraper.service.CustomUserDetailsService;
import com.scrapify.webscraper.service.ScrapingJobService;
import com.scrapify.webscraper.service.ScraperService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Use @WebMvcTest for controller layer tests, targeting a specific controller
@WebMvcTest(ScrapingJobController.class)
// Import security configurations and other necessary beans
@Import({SecurityConfig.class, JwtUtil.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
class ScrapingJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @MockBean
    private ScrapingJobService scrapingJobService;

    @MockBean
    private ScraperService scraperService;

    @MockBean
    private CustomUserDetailsService userDetailsService; // Needed by JwtAuthFilter

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private ScrapingJobResponse sampleJobResponse;
    private UUID jobId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .password("encodedPassword")
                .email("test@example.com")
                .roles(Set.of(Role.USER))
                .build();

        sampleJobResponse = ScrapingJobResponse.builder()
                .id(jobId)
                .name("Test Job")
                .targetUrl("http://test.com")
                .config(Map.of("key", "value"))
                .status(JobStatus.PENDING)
                .createdByUsername(testUser.getUsername())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Mock authentication for the @AuthenticationPrincipal parameter in controller methods
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities())
        );
    }

    private UsernamePasswordAuthenticationToken createAuthToken(User user) {
        return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testCreateScrapingJob_Success() throws Exception {
        ScrapingJobRequest request = new ScrapingJobRequest();
        request.setName("New Job");
        request.setTargetUrl("http://new.com");
        request.setConfig(Map.of("item", ".product"));

        ScrapingJobResponse createdResponse = ScrapingJobResponse.builder()
                .id(UUID.randomUUID())
                .name("New Job")
                .targetUrl("http://new.com")
                .config(Map.of("item", ".product"))
                .status(JobStatus.PENDING)
                .createdByUsername("testuser")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(scrapingJobService.createScrapingJob(any(ScrapingJobRequest.class), any(User.class)))
                .thenReturn(createdResponse);

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Job"))
                .andExpect(jsonPath("$.targetUrl").value("http://new.com"));

        verify(scrapingJobService, times(1)).createScrapingJob(any(ScrapingJobRequest.class), any(User.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testGetAllScrapingJobs_Success() throws Exception {
        when(scrapingJobService.getAllScrapingJobsForUser(any(User.class)))
                .thenReturn(List.of(sampleJobResponse));

        mockMvc.perform(get("/api/jobs")
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(sampleJobResponse.getId().toString()))
                .andExpect(jsonPath("$[0].name").value(sampleJobResponse.getName()));

        verify(scrapingJobService, times(1)).getAllScrapingJobsForUser(any(User.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testGetScrapingJobById_Success() throws Exception {
        when(scrapingJobService.getScrapingJobById(eq(jobId), any(User.class)))
                .thenReturn(sampleJobResponse);

        mockMvc.perform(get("/api/jobs/{jobId}", jobId)
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId.toString()))
                .andExpect(jsonPath("$.name").value(sampleJobResponse.getName()));

        verify(scrapingJobService, times(1)).getScrapingJobById(eq(jobId), any(User.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testGetScrapingJobById_NotFound() throws Exception {
        when(scrapingJobService.getScrapingJobById(eq(jobId), any(User.class)))
                .thenThrow(new ResourceNotFoundException("Job not found"));

        mockMvc.perform(get("/api/jobs/{jobId}", jobId)
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Job not found"));

        verify(scrapingJobService, times(1)).getScrapingJobById(eq(jobId), any(User.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testUpdateScrapingJob_Success() throws Exception {
        ScrapingJobRequest request = new ScrapingJobRequest();
        request.setName("Updated Job");
        request.setTargetUrl("http://updated.com");
        request.setConfig(Map.of("new_key", "new_value"));

        ScrapingJobResponse updatedResponse = ScrapingJobResponse.builder()
                .id(jobId)
                .name("Updated Job")
                .targetUrl("http://updated.com")
                .config(Map.of("new_key", "new_value"))
                .status(JobStatus.PENDING)
                .createdByUsername("testuser")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(scrapingJobService.updateScrapingJob(eq(jobId), any(ScrapingJobRequest.class), any(User.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/jobs/{jobId}", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Job"))
                .andExpect(jsonPath("$.targetUrl").value("http://updated.com"));

        verify(scrapingJobService, times(1)).updateScrapingJob(eq(jobId), any(ScrapingJobRequest.class), any(User.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testDeleteScrapingJob_Success() throws Exception {
        doNothing().when(scrapingJobService).deleteScrapingJob(eq(jobId), any(User.class));

        mockMvc.perform(delete("/api/jobs/{jobId}", jobId)
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isNoContent());

        verify(scrapingJobService, times(1)).deleteScrapingJob(eq(jobId), any(User.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testRunScrapingJob_Success() throws Exception {
        doNothing().when(scraperService).executeScrapingJob(eq(jobId));

        mockMvc.perform(post("/api/jobs/{jobId}/run", jobId)
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Scraping job triggered successfully. Check logs for status."));

        verify(scraperService, times(1)).executeScrapingJob(eq(jobId));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testGetScrapedDataForJob_Success() throws Exception {
        ScrapedDataResponse dataResponse = ScrapedDataResponse.builder()
                .id(UUID.randomUUID())
                .jobId(jobId)
                .jobName("Test Job")
                .data(Map.of("title", "Scraped Title"))
                .scrapedUrl("http://test.com")
                .scrapedAt(LocalDateTime.now())
                .build();
        PageImpl<ScrapedDataResponse> page = new PageImpl<>(List.of(dataResponse));

        when(scrapingJobService.getScrapedDataForJob(eq(jobId), any(User.class), anyInt(), anyInt()))
                .thenReturn(page);

        mockMvc.perform(get("/api/jobs/{jobId}/data", jobId)
                        .param("page", "0")
                        .param("size", "10")
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].jobId").value(jobId.toString()))
                .andExpect(jsonPath("$.content[0].data.title").value("Scraped Title"));

        verify(scrapingJobService, times(1)).getScrapedDataForJob(eq(jobId), any(User.class), anyInt(), anyInt());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "USER")
    void testGetJobExecutionLogs_Success() throws Exception {
        // Similar test structure for logs endpoint
        mockMvc.perform(get("/api/jobs/{jobId}/logs", jobId)
                        .param("page", "0")
                        .param("size", "10")
                        .with(authentication(createAuthToken(testUser))))
                .andExpect(status().isOk()); // Assuming an empty page if no mock data
        verify(scrapingJobService, times(1)).getJobExecutionLogs(eq(jobId), any(User.class), anyInt(), anyInt());
    }
}
```