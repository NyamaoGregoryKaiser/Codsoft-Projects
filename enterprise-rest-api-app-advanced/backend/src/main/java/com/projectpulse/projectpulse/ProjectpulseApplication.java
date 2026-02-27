package com.projectpulse.projectpulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching // Enable Spring's cache abstraction
public class ProjectpulseApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjectpulseApplication.class, args);
    }

}