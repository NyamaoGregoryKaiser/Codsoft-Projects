package com.example.webscrapingtools.scraping.service;

import com.example.webscrapingtools.auth.model.User;
import com.example.webscrapingtools.common.error.ResourceNotFoundException;
import com.example.webscrapingtools.common.util.ScraperUtils;
import com.example.webscrapingtools.scraping.dto.ScraperCreateRequest;
import com.example.webscrapingtools.scraping.dto.ScraperDefinitionDTO;
import com.example.webscrapingtools.scraping.dto.ScraperUpdateRequest;
import com.example.webscrapingtools.scraping.model.ScraperDefinition;
import com.example.webscrapingtools.scraping.repository.ScraperDefinitionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScraperDefinitionService {

    private final ScraperDefinitionRepository scraperDefinitionRepository;
    private final ObjectMapper objectMapper;
    private final ScraperUtils scraperUtils;

    private static final String CACHE_NAME = "scraperDefinitions";

    @Transactional
    public ScraperDefinitionDTO createScraper(ScraperCreateRequest request, User currentUser) throws JsonProcessingException {
        if (!scraperUtils.isValidUrl(request.getTargetUrl())) {
            throw new IllegalArgumentException("Invalid target URL provided: " + request.getTargetUrl());
        }
        if (scraperDefinitionRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Scraper with name '" + request.getName() + "' already exists.");
        }

        String fieldDefinitionsJson = objectMapper.writeValueAsString(request.getFieldDefinitions());

        ScraperDefinition scraperDefinition = ScraperDefinition.builder()
                .name(request.getName())
                .targetUrl(request.getTargetUrl())
                .itemCssSelector(request.getItemCssSelector())
                .fieldDefinitionsJson(fieldDefinitionsJson)
                .scheduleIntervalMinutes(request.getScheduleIntervalMinutes())
                .active(true)
                .createdBy(currentUser)
                .build();

        ScraperDefinition savedScraper = scraperDefinitionRepository.save(scraperDefinition);
        log.info("Created new scraper definition: {}", savedScraper.getName());
        return ScraperDefinitionDTO.fromEntity(savedScraper, request.getFieldDefinitions());
    }

    @Cacheable(value = CACHE_NAME, key = "#id")
    public ScraperDefinitionDTO getScraperById(Long id) {
        ScraperDefinition scraperDefinition = scraperDefinitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scraper Definition not found with id: " + id));
        return convertToDto(scraperDefinition);
    }

    public ScraperDefinition getScraperEntityById(Long id) {
        return scraperDefinitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scraper Definition not found with id: " + id));
    }

    public Page<ScraperDefinitionDTO> getAllScrapers(Pageable pageable) {
        return scraperDefinitionRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    public List<ScraperDefinition> getScheduledScrapers() {
        return scraperDefinitionRepository.findByActiveTrueAndScheduleIntervalMinutesGreaterThan(0);
    }


    @Transactional
    @CachePut(value = CACHE_NAME, key = "#id")
    public ScraperDefinitionDTO updateScraper(Long id, ScraperUpdateRequest request) throws JsonProcessingException {
        ScraperDefinition existingScraper = scraperDefinitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scraper Definition not found with id: " + id));

        Optional.ofNullable(request.getName()).ifPresent(name -> {
            if (!name.equals(existingScraper.getName()) && scraperDefinitionRepository.findByName(name).isPresent()) {
                throw new IllegalArgumentException("Scraper with name '" + name + "' already exists.");
            }
            existingScraper.setName(name);
        });

        Optional.ofNullable(request.getTargetUrl()).ifPresent(url -> {
            if (!scraperUtils.isValidUrl(url)) {
                throw new IllegalArgumentException("Invalid target URL provided: " + url);
            }
            existingScraper.setTargetUrl(url);
        });
        Optional.ofNullable(request.getItemCssSelector()).ifPresent(existingScraper::setItemCssSelector);
        Optional.ofNullable(request.getScheduleIntervalMinutes()).ifPresent(existingScraper::setScheduleIntervalMinutes);
        Optional.ofNullable(request.getActive()).ifPresent(existingScraper::setActive);

        if (request.getFieldDefinitions() != null && !request.getFieldDefinitions().isEmpty()) {
            existingScraper.setFieldDefinitionsJson(objectMapper.writeValueAsString(request.getFieldDefinitions()));
        }

        ScraperDefinition updatedScraper = scraperDefinitionRepository.save(existingScraper);
        log.info("Updated scraper definition: {}", updatedScraper.getName());
        return convertToDto(updatedScraper);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, key = "#id")
    public void deleteScraper(Long id) {
        if (!scraperDefinitionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Scraper Definition not found with id: " + id);
        }
        scraperDefinitionRepository.deleteById(id);
        log.info("Deleted scraper definition with id: {}", id);
    }

    private ScraperDefinitionDTO convertToDto(ScraperDefinition scraperDefinition) {
        Map<String, String> fieldDefs = null;
        if (scraperDefinition.getFieldDefinitionsJson() != null) {
            try {
                fieldDefs = objectMapper.readValue(scraperDefinition.getFieldDefinitionsJson(), new TypeReference<>() {});
            } catch (JsonProcessingException e) {
                log.error("Failed to parse field definitions JSON for scraper {}: {}", scraperDefinition.getId(), e.getMessage());
                // Handle parsing error, maybe return an empty map or specific error indication
                fieldDefs = Map.of("error", "Failed to parse field definitions");
            }
        }
        return ScraperDefinitionDTO.fromEntity(scraperDefinition, fieldDefs);
    }
}