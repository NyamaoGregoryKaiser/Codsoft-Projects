```java
package com.scrapify.webscraper;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Enable Spring's task scheduling capabilities
@EnableCaching    // Enable Spring's caching abstraction
public class WebScraperApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebScraperApplication.class, args);
    }

}
```