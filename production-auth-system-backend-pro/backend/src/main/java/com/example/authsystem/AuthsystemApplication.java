```java
package com.example.authsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching // Enable Spring's Caching Abstraction
public class AuthsystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthsystemApplication.class, args);
    }

}
```