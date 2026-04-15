package com.example.webscrapingtools.web.controller;

import com.example.webscrapingtools.auth.model.User;
import com.example.webscrapingtools.auth.repository.UserRepository;
import com.example.webscrapingtools.common.error.ResourceNotFoundException;
import com.example.webscrapingtools.scraping.dto.ScraperCreateRequest;
import com.example.webscrapingtools.scraping.dto.ScraperDefinitionDTO;
import com.example.webscrapingtools.scraping.dto.ScraperUpdateRequest;
import com.example.webscrapingtools.scraping.service.ScrapedDataService;
import com.example.webscrapingtools.scraping.service.ScraperDefinitionService;
import com.example.webscrapingtools.scraping.service.ScrapingService;
import com.example.webscrapingtools.web.dto.WebScraperFormDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebPagesController {

    private final ScraperDefinitionService scraperDefinitionService;
    private final ScrapingService scrapingService;
    private final ScrapedDataService scrapedDataService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof User user) {
            return userRepository.findByUsername(user.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in DB."));
        }
        throw new IllegalStateException("User not authenticated.");
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/scrapers";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/scrapers")
    public String listScrapers(Model model, @PageableDefault(size = 10) Pageable pageable) {
        model.addAttribute("scrapersPage", scraperDefinitionService.getAllScrapers(pageable));
        model.addAttribute("newScraper", new WebScraperFormDTO());
        return "scrapers";
    }

    @GetMapping("/scrapers/{id}")
    public String scraperDetail(@PathVariable Long id, Model model, @PageableDefault(size = 5) Pageable pageable) {
        ScraperDefinitionDTO scraper = scraperDefinitionService.getScraperById(id);
        model.addAttribute("scraper", scraper);
        model.addAttribute("tasksPage", scraperDefinitionService.getScraperEntityById(id).getScheduleIntervalMinutes() != null ? scrapingService.triggerScraping(id, getCurrentUser()) : null);
        model.addAttribute("tasksPage", scraperDefinitionService.getScraperEntityById(id).getScheduleIntervalMinutes() != null ? scrapingService.triggerScraping(id, getCurrentUser()) : null);

        // Convert DTO to FormDTO for editing
        WebScraperFormDTO formDto = new WebScraperFormDTO();
        formDto.setId(scraper.getId());
        formDto.setName(scraper.getName());
        formDto.setTargetUrl(scraper.getTargetUrl());
        formDto.setItemCssSelector(scraper.getItemCssSelector());
        formDto.setScheduleIntervalMinutes(scraper.getScheduleIntervalMinutes());
        formDto.setActive(scraper.isActive());
        try {
            formDto.setFieldDefinitionsJson(objectMapper.writeValueAsString(scraper.getFieldDefinitions()));
        } catch (JsonProcessingException e) {
            log.error("Failed to convert field definitions to JSON for UI: {}", e.getMessage());
            formDto.setFieldDefinitionsJson("{}");
        }
        model.addAttribute("editScraper", formDto);

        model.addAttribute("tasksPage", scrapedDataService.getScrapedDataByScraperDefinitionId(id, pageable));
        return "scraper-detail";
    }


    @PostMapping("/scrapers")
    public String createScraper(@ModelAttribute("newScraper") @jakarta.validation.Valid WebScraperFormDTO formDto,
                                BindingResult bindingResult,
                                RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.newScraper", bindingResult);
            redirectAttributes.addFlashAttribute("newScraper", formDto);
            redirectAttributes.addFlashAttribute("error", "Validation failed for new scraper.");
            return "redirect:/scrapers";
        }

        try {
            Map<String, String> fieldDefinitions = objectMapper.readValue(formDto.getFieldDefinitionsJson(), new TypeReference<>() {});
            ScraperCreateRequest request = ScraperCreateRequest.builder()
                    .name(formDto.getName())
                    .targetUrl(formDto.getTargetUrl())
                    .itemCssSelector(formDto.getItemCssSelector())
                    .fieldDefinitions(fieldDefinitions)
                    .scheduleIntervalMinutes(formDto.getScheduleIntervalMinutes())
                    .build();
            scraperDefinitionService.createScraper(request, getCurrentUser());
            redirectAttributes.addFlashAttribute("success", "Scraper created successfully!");
        } catch (JsonProcessingException e) {
            bindingResult.addError(new FieldError("newScraper", "fieldDefinitionsJson", "Invalid JSON format for field definitions."));
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.newScraper", bindingResult);
            redirectAttributes.addFlashAttribute("newScraper", formDto);
            redirectAttributes.addFlashAttribute("error", "Invalid JSON for field definitions.");
        } catch (IllegalArgumentException e) {
            bindingResult.addError(new FieldError("newScraper", "name", e.getMessage()));
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.newScraper", bindingResult);
            redirectAttributes.addFlashAttribute("newScraper", formDto);
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/scrapers";
    }

    @PostMapping("/scrapers/{id}/update")
    public String updateScraper(@PathVariable Long id,
                                @ModelAttribute("editScraper") @jakarta.validation.Valid WebScraperFormDTO formDto,
                                BindingResult bindingResult,
                                RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.editScraper", bindingResult);
            redirectAttributes.addFlashAttribute("editScraper", formDto);
            redirectAttributes.addFlashAttribute("error", "Validation failed for scraper update.");
            return "redirect:/scrapers/" + id;
        }

        try {
            Map<String, String> fieldDefinitions = objectMapper.readValue(formDto.getFieldDefinitionsJson(), new TypeReference<>() {});
            ScraperUpdateRequest request = ScraperUpdateRequest.builder()
                    .name(formDto.getName())
                    .targetUrl(formDto.getTargetUrl())
                    .itemCssSelector(formDto.getItemCssSelector())
                    .fieldDefinitions(fieldDefinitions)
                    .scheduleIntervalMinutes(formDto.getScheduleIntervalMinutes())
                    .active(formDto.isActive())
                    .build();
            scraperDefinitionService.updateScraper(id, request);
            redirectAttributes.addFlashAttribute("success", "Scraper updated successfully!");
        } catch (JsonProcessingException e) {
            bindingResult.addError(new FieldError("editScraper", "fieldDefinitionsJson", "Invalid JSON format for field definitions."));
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.editScraper", bindingResult);
            redirectAttributes.addFlashAttribute("editScraper", formDto);
            redirectAttributes.addFlashAttribute("error", "Invalid JSON for field definitions.");
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/scrapers/" + id;
    }

    @PostMapping("/scrapers/{id}/delete")
    public String deleteScraper(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            scraperDefinitionService.deleteScraper(id);
            redirectAttributes.addFlashAttribute("success", "Scraper deleted successfully!");
        } catch (ResourceNotFoundException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/scrapers";
    }

    @PostMapping("/scrapers/{id}/run")
    public String runScraper(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            scrapingService.triggerScraping(id, getCurrentUser());
            redirectAttributes.addFlashAttribute("success", "Scraping task initiated!");
        } catch (ResourceNotFoundException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/scrapers/" + id;
    }
}