package com.cms.system.controller;

import com.cms.system.dto.category.CategoryDto;
import com.cms.system.dto.content.ContentCreateRequest;
import com.cms.system.dto.content.ContentDto;
import com.cms.system.dto.content.ContentUpdateRequest;
import com.cms.system.model.Content;
import com.cms.system.service.CategoryService;
import com.cms.system.service.ContentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/content")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')") // Only ADMINs and EDITORs can manage content via UI
@Slf4j
public class ContentWebController {

    private final ContentService contentService;
    private final CategoryService categoryService;

    public ContentWebController(ContentService contentService, CategoryService categoryService) {
        this.contentService = contentService;
        this.categoryService = categoryService;
    }

    @GetMapping("/list")
    public String listContent(Model model,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "10") int size,
                              @RequestParam(defaultValue = "createdAt,desc") String sort) {
        String[] sortParams = sort.split(",");
        Sort sorting = Sort.by(Sort.Direction.fromString(sortParams[1]), sortParams[0]);
        Pageable pageable = PageRequest.of(page, size, sorting);

        Page<ContentDto> contents = contentService.getAllContent(pageable);
        model.addAttribute("contents", contents);
        model.addAttribute("currentPage", page);
        model.addAttribute("pageSize", size);
        model.addAttribute("sort", sort);
        log.debug("Displaying content list page {} with {} items.", page, contents.getNumberOfElements());
        return "content/list";
    }

    @GetMapping("/create")
    public String showCreateContentForm(Model model) {
        model.addAttribute("content", new ContentCreateRequest());
        model.addAttribute("categories", categoryService.getAllCategories(Pageable.unpaged()).getContent());
        model.addAttribute("statuses", Content.ContentStatus.values());
        log.debug("Showing content creation form.");
        return "content/form";
    }

    @PostMapping("/create")
    public String createContent(@Valid @ModelAttribute("content") ContentCreateRequest contentRequest,
                                BindingResult result,
                                RedirectAttributes redirectAttributes,
                                Model model) {
        if (result.hasErrors()) {
            model.addAttribute("categories", categoryService.getAllCategories(Pageable.unpaged()).getContent());
            model.addAttribute("statuses", Content.ContentStatus.values());
            log.warn("Content creation form has errors: {}", result.getAllErrors());
            return "content/form";
        }
        try {
            contentService.createContent(contentRequest);
            redirectAttributes.addFlashAttribute("successMessage", "Content created successfully!");
            log.info("Content '{}' created successfully.", contentRequest.getTitle());
            return "redirect:/content/list";
        } catch (Exception e) {
            model.addAttribute("errorMessage", "Error creating content: " + e.getMessage());
            model.addAttribute("categories", categoryService.getAllCategories(Pageable.unpaged()).getContent());
            model.addAttribute("statuses", Content.ContentStatus.values());
            log.error("Error creating content: {}", e.getMessage(), e);
            return "content/form";
        }
    }

    @GetMapping("/edit/{id}")
    public String showEditContentForm(@PathVariable Long id, Model model) {
        ContentDto contentDto = contentService.getContentById(id);
        ContentUpdateRequest updateRequest = new ContentUpdateRequest();
        updateRequest.setTitle(contentDto.getTitle());
        updateRequest.setBody(contentDto.getBody());
        updateRequest.setSlug(contentDto.getSlug());
        updateRequest.setCategoryId(contentDto.getCategory() != null ? contentDto.getCategory().getId() : null);
        updateRequest.setStatus(contentDto.getStatus());

        model.addAttribute("content", updateRequest);
        model.addAttribute("contentId", id);
        model.addAttribute("categories", categoryService.getAllCategories(Pageable.unpaged()).getContent());
        model.addAttribute("statuses", Content.ContentStatus.values());
        log.debug("Showing edit form for content ID: {}", id);
        return "content/form";
    }

    @PostMapping("/edit/{id}")
    public String updateContent(@PathVariable Long id,
                                @Valid @ModelAttribute("content") ContentUpdateRequest contentRequest,
                                BindingResult result,
                                RedirectAttributes redirectAttributes,
                                Model model) {
        if (result.hasErrors()) {
            model.addAttribute("contentId", id);
            model.addAttribute("categories", categoryService.getAllCategories(Pageable.unpaged()).getContent());
            model.addAttribute("statuses", Content.ContentStatus.values());
            log.warn("Content update form for ID {} has errors: {}", id, result.getAllErrors());
            return "content/form";
        }
        try {
            contentService.updateContent(id, contentRequest);
            redirectAttributes.addFlashAttribute("successMessage", "Content updated successfully!");
            log.info("Content ID {} updated successfully.", id);
            return "redirect:/content/list";
        } catch (Exception e) {
            model.addAttribute("errorMessage", "Error updating content: " + e.getMessage());
            model.addAttribute("contentId", id);
            model.addAttribute("categories", categoryService.getAllCategories(Pageable.unpaged()).getContent());
            model.addAttribute("statuses", Content.ContentStatus.values());
            log.error("Error updating content ID {}: {}", id, e.getMessage(), e);
            return "content/form";
        }
    }

    @PostMapping("/delete/{id}")
    public String deleteContent(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            contentService.deleteContent(id);
            redirectAttributes.addFlashAttribute("successMessage", "Content deleted successfully!");
            log.info("Content ID {} deleted successfully.", id);
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting content: " + e.getMessage());
            log.error("Error deleting content ID {}: {}", id, e.getMessage(), e);
        }
        return "redirect:/content/list";
    }
}