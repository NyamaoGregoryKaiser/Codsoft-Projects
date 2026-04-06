package com.cms.system.controller;

import com.cms.system.dto.content.ContentDto;
import com.cms.system.service.ContentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@Slf4j
public class DashboardController {

    private final ContentService contentService;

    public DashboardController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/dashboard"; // Redirect to dashboard after login
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()") // Only authenticated users can access dashboard
    public String dashboard(Model model,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ContentDto> contents = contentService.getAllContent(pageable);

        model.addAttribute("contents", contents);
        log.info("Accessed dashboard. Showing {} contents.", contents.getNumberOfElements());
        return "dashboard";
    }

    @GetMapping("/access-denied")
    public String accessDenied() {
        return "error/403";
    }
}