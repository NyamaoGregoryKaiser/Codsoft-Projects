```java
package com.tasksyncpro.tasksyncpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching // Enable Spring's caching abstraction
@EnableScheduling // Enable scheduling for potential future tasks or cache evictions
public class TaskSyncProApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskSyncProApplication.class, args);
    }

}
```