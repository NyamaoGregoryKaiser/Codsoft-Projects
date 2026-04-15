package com.example.webscrapingtools.scraping.service;

import com.example.webscrapingtools.common.error.ResourceNotFoundException;
import com.example.webscrapingtools.scraping.dto.ScrapedDataDTO;
import com.example.webscrapingtools.scraping.model.ScrapedDataItem;
import com.example.webscrapingtools.scraping.repository.ScrapedDataItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScrapedDataService {

    private final ScrapedDataItemRepository scrapedDataItemRepository;

    public ScrapedDataDTO getScrapedDataById(Long id) {
        ScrapedDataItem item = scrapedDataItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scraped data item not found with id: " + id));
        return ScrapedDataDTO.fromEntity(item);
    }

    public Page<ScrapedDataDTO> getAllScrapedData(Pageable pageable) {
        return scrapedDataItemRepository.findAll(pageable)
                .map(ScrapedDataDTO::fromEntity);
    }

    public Page<ScrapedDataDTO> getScrapedDataByTaskId(Long taskId, Pageable pageable) {
        return scrapedDataItemRepository.findByScrapingTaskId(taskId, pageable)
                .map(ScrapedDataDTO::fromEntity);
    }

    public Page<ScrapedDataDTO> getScrapedDataByScraperDefinitionId(Long scraperDefinitionId, Pageable pageable) {
        return scrapedDataItemRepository.findByScraperDefinitionId(scraperDefinitionId, pageable)
                .map(ScrapedDataDTO::fromEntity);
    }
}