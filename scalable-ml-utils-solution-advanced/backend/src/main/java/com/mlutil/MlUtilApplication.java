package com.mlutil;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching // Enable Spring's Caching abstraction
@EnableScheduling // Enable scheduling if needed for future tasks
public class MlUtilApplication {

    public static void main(String[] args) {
        SpringApplication.run(MlUtilApplication.class, args);
    }

}