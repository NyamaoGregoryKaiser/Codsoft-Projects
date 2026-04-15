package com.example.webscrapingtools.scraping.repository;

import com.example.webscrapingtools.scraping.model.ScrapingTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScrapingTaskRepository extends JpaRepository<ScrapingTask, Long> {
    Page<ScrapingTask> findByScraperDefinitionId(Long scraperDefinitionId, Pageable pageable);
    List<ScrapingTask> findByScraperDefinitionIdOrderByStartTimeDesc(Long scraperDefinitionId, Pageable pageable); // For latest task
}