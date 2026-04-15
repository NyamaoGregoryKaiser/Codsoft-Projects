package com.example.webscrapingtools.scraping.controller;

import com.example.webscrapingtools.auth.dto.AuthRequest;
import com.example.webscrapingtools.auth.dto.AuthResponse;
import com.example.webscrapingtools.auth.model.Role;
import com.example.webscrapingtools.auth.model.User;
import com.example.webscrapingtools.auth.repository.UserRepository;
import com.example.webscrapingtools.scraping.dto.ScraperCreateRequest;
import com.example.webscrapingtools.scraping.dto.ScraperDefinitionDTO;
import com.example.webscrapingtools.scraping.dto.ScraperUpdateRequest;
import com.example.webscrapingtools.scraping.model.ScraperDefinition;
import com.example.webscrapingtools.scraping.repository.ScraperDefinitionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class ScraperIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // Ensure clean schema for tests
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ScraperDefinitionRepository scraperDefinitionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private User adminUser;

    @BeforeEach
    void setUp() throws Exception {
        // Clear repositories before each test
        scraperDefinitionRepository.deleteAll();
        userRepository.deleteAll();

        // Create an admin user for testing
        adminUser = User.builder()
                .username("testadmin")
                .password(passwordEncoder.encode("adminpassword"))
                .role(Role.ADMIN)
                .build();
        userRepository.save(adminUser);

        // Authenticate admin user to get a JWT token
        AuthRequest authRequest = new AuthRequest("testadmin", "adminpassword");
        MvcResult result = mockMvc.perform(post("/api/auth/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        adminToken = authResponse.getToken();
    }

    @Test
    void testCreateScraper_Success() throws Exception {
        ScraperCreateRequest createRequest = ScraperCreateRequest.builder()
                .name("Test Scraper")
                .targetUrl("https://example.com")
                .itemCssSelector(".item")
                .fieldDefinitions(Map.of("title", ".title", "price", ".price"))
                .scheduleIntervalMinutes(60)
                .build();

        mockMvc.perform(post("/api/scrapers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Test Scraper")))
                .andExpect(jsonPath("$.targetUrl", is("https://example.com")))
                .andExpect(jsonPath("$.fieldDefinitions.title", is(".title")));
    }

    @Test
    void testCreateScraper_InvalidUrl() throws Exception {
        ScraperCreateRequest createRequest = ScraperCreateRequest.builder()
                .name("Invalid URL Scraper")
                .targetUrl("invalid-url") // Invalid URL
                .itemCssSelector(".item")
                .fieldDefinitions(Map.of("title", ".title"))
                .scheduleIntervalMinutes(0)
                .build();

        mockMvc.perform(post("/api/scrapers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Validation Error")))
                .andExpect(jsonPath("$.errors", containsInAnyOrder("Invalid URL format")));
    }


    @Test
    void testGetScraperById_Success() throws Exception {
        ScraperDefinition scraper = ScraperDefinition.builder()
                .name("Retrieve Scraper")
                .targetUrl("https://retrieve.com")
                .itemCssSelector(".data")
                .fieldDefinitionsJson(objectMapper.writeValueAsString(Map.of("field", ".selector")))
                .scheduleIntervalMinutes(30)
                .active(true)
                .createdBy(adminUser)
                .build();
        scraper = scraperDefinitionRepository.save(scraper);

        mockMvc.perform(get("/api/scrapers/{id}", scraper.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Retrieve Scraper")))
                .andExpect(jsonPath("$.targetUrl", is("https://retrieve.com")));
    }

    @Test
    void testUpdateScraper_Success() throws Exception {
        ScraperDefinition scraper = ScraperDefinition.builder()
                .name("Update Scraper")
                .targetUrl("https://old.com")
                .itemCssSelector(".old")
                .fieldDefinitionsJson(objectMapper.writeValueAsString(Map.of("field", ".old-selector")))
                .scheduleIntervalMinutes(15)
                .active(true)
                .createdBy(adminUser)
                .build();
        scraper = scraperDefinitionRepository.save(scraper);

        ScraperUpdateRequest updateRequest = ScraperUpdateRequest.builder()
                .targetUrl("https://new.com")
                .scheduleIntervalMinutes(45)
                .active(false)
                .build();

        mockMvc.perform(put("/api/scrapers/{id}", scraper.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetUrl", is("https://new.com")))
                .andExpect(jsonPath("$.scheduleIntervalMinutes", is(45)))
                .andExpect(jsonPath("$.active", is(false)));
    }

    @Test
    void testDeleteScraper_Success() throws Exception {
        ScraperDefinition scraper = ScraperDefinition.builder()
                .name("Delete Scraper")
                .targetUrl("https://delete.com")
                .itemCssSelector(".delete")
                .fieldDefinitionsJson(objectMapper.writeValueAsString(Map.of("field", ".del-selector")))
                .scheduleIntervalMinutes(0)
                .active(true)
                .createdBy(adminUser)
                .build();
        scraper = scraperDefinitionRepository.save(scraper);

        mockMvc.perform(delete("/api/scrapers/{id}", scraper.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/scrapers/{id}", scraper.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void testTriggerScraping_Success() throws Exception {
        ScraperDefinition scraper = ScraperDefinition.builder()
                .name("Trigger Scraper")
                .targetUrl("https://books.toscrape.com/") // Using a real, simple scrape target
                .itemCssSelector("article.product_pod")
                .fieldDefinitionsJson(objectMapper.writeValueAsString(Map.of("title", "h3 a[title]", "price", "p.price_color")))
                .scheduleIntervalMinutes(0)
                .active(true)
                .createdBy(adminUser)
                .build();
        scraper = scraperDefinitionRepository.save(scraper);

        mockMvc.perform(post("/api/scrapers/{id}/run", scraper.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.scraperDefinitionId", is(scraper.getId().intValue())))
                .andExpect(jsonPath("$.status", is("PENDING")));

        // In a full integration test, you might add a delay and then check the database
        // for COMPLETED task and scraped data, but that would make this test very slow.
        // This confirms the initiation.
    }
}