package com.example.webscrapingtools.scraping.repository;

import com.example.webscrapingtools.scraping.model.ScraperDefinition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScraperDefinitionRepository extends JpaRepository<ScraperDefinition, Long> {
    Optional<ScraperDefinition> findByName(String name);
    Page<ScraperDefinition> findAllByActive(boolean active, Pageable pageable);
    List<ScraperDefinition> findByActiveTrueAndScheduleIntervalMinutesGreaterThan(Integer interval);
}