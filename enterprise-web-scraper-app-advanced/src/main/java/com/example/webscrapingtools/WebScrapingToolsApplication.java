package com.example.webscrapingtools;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Enable Spring's scheduled task execution
@EnableCaching    // Enable Spring's caching abstraction
public class WebScrapingToolsApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebScrapingToolsApplication.class, args);
    }

}