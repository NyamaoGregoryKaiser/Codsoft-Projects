package com.example.webscrapingtools.scraping.repository;

import com.example.webscrapingtools.scraping.model.ScrapedDataItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScrapedDataItemRepository extends JpaRepository<ScrapedDataItem, Long> {
    Page<ScrapedDataItem> findByScrapingTaskId(Long scrapingTaskId, Pageable pageable);
    Page<ScrapedDataItem> findByScraperDefinitionId(Long scraperDefinitionId, Pageable pageable);
    // You might add more complex queries here, e.g., filtering by data content using JSONB operators
    // @Query(value = "SELECT * FROM scraped_data_item WHERE data->>'price' = :price", nativeQuery = true)
    // List<ScrapedDataItem> findByDataPrice(@Param("price") String price);
}