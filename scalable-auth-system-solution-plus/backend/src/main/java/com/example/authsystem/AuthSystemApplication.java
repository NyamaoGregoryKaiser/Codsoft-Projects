package com.example.authsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching // Enable Spring's caching abstraction
@EnableScheduling // Enable Spring's scheduled tasks (e.g., for refresh token cleanup)
public class AuthSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthSystemApplication.class, args);
    }

}