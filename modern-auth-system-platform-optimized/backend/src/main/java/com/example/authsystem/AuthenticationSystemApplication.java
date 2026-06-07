```java
package com.example.authsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching // Enable Spring's Caching abstraction
@EnableScheduling // Enable scheduling for potential background tasks like cache eviction, etc.
public class AuthenticationSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthenticationSystemApplication.class, args);
    }

}
```