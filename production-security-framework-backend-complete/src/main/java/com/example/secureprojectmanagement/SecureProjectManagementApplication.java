package com.example.secureprojectmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching // Enable Spring's caching mechanism
public class SecureProjectManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureProjectManagementApplication.class, args);
    }

}