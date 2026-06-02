package com.etms.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class EtmsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(EtmsBackendApplication.class, args);
    }

}