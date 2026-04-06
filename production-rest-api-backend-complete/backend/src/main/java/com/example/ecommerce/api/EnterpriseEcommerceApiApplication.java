package com.example.ecommerce.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching // Enable Spring's caching abstraction
public class EnterpriseEcommerceApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnterpriseEcommerceApiApplication.class, args);
    }

}