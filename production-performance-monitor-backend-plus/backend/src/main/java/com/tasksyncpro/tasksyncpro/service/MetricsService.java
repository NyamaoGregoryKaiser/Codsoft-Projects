```java
package com.tasksyncpro.tasksyncpro.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.TimeUnit;

/**
 * Service to manage and expose custom application metrics using Micrometer.
 */
@Service
@RequiredArgsConstructor
public class MetricsService {

    private final MeterRegistry meterRegistry;

    // Counters
    private Counter userRegisteredCounter;
    private Counter projectCreatedCounter;
    private Counter taskCreatedCounter;
    private Counter taskDeletedCounter;
    private Counter apiRateLimitExceededCounter;
    private Counter cacheHitCounter;
    private Counter cacheMissCounter;
    private Counter databaseQueryErrorCounter;

    // Gauges
    private AtomicInteger activeUsersGauge = new AtomicInteger(0); // Example, can be managed by actual active sessions
    private AtomicInteger totalProjectsGauge = new AtomicInteger(0); // Example, can be updated on CRUD
    private AtomicInteger totalTasksGauge = new AtomicInteger(0);

    @PostConstruct
    public void init() {
        // Initialize Counters
        userRegisteredCounter = Counter.builder("app.users.registered.total")
                .description("Total number of users registered")
                .register(meterRegistry);

        projectCreatedCounter = Counter.builder("app.projects.created.total")
                .description("Total number of projects created")
                .register(meterRegistry);

        taskCreatedCounter = Counter.builder("app.tasks.created.total")
                .description("Total number of tasks created")
                .register(meterRegistry);

        taskDeletedCounter = Counter.builder("app.tasks.deleted.total")
                .description("Total number of tasks deleted")
                .register(meterRegistry);

        apiRateLimitExceededCounter = Counter.builder("app.api.rate_limit.exceeded.total")
                .description("Total number of times API rate limits were exceeded")
                .register(meterRegistry);

        cacheHitCounter = Counter.builder("app.cache.hits.total")
                .description("Total cache hits")
                .register(meterRegistry);

        cacheMissCounter = Counter.builder("app.cache.misses.total")
                .description("Total cache misses")
                .register(meterRegistry);

        databaseQueryErrorCounter = Counter.builder("app.database.query.errors.total")
                .description("Total database query errors")
                .register(meterRegistry);

        // Initialize Gauges
        // Gauges need a way to get the current value, often through a method or an Atomic variable
        Gauge.builder("app.users.active.current", activeUsersGauge, AtomicInteger::get)
                .description("Current number of active users (simulated)")
                .register(meterRegistry);

        Gauge.builder("app.projects.total.current", totalProjectsGauge, AtomicInteger::get)
                .description("Current total number of projects")
                .register(meterRegistry);

        Gauge.builder("app.tasks.total.current", totalTasksGauge, AtomicInteger::get)
                .description("Current total number of tasks")
                .register(meterRegistry);
    }

    public void incrementUserRegisteredCounter() {
        userRegisteredCounter.increment();
        activeUsersGauge.incrementAndGet(); // Simulate active users increase
    }

    public void incrementProjectCreatedCounter() {
        projectCreatedCounter.increment();
        totalProjectsGauge.incrementAndGet();
    }

    public void decrementProjectCountGauge() {
        totalProjectsGauge.decrementAndGet();
    }

    public void incrementTaskCreatedCounter() {
        taskCreatedCounter.increment();
        totalTasksGauge.incrementAndGet();
    }

    public void incrementTaskDeletedCounter() {
        taskDeletedCounter.increment();
        totalTasksGauge.decrementAndGet();
    }

    public void incrementApiRateLimitExceededCounter() {
        apiRateLimitExceededCounter.increment();
    }

    public void incrementCacheHitCounter() {
        cacheHitCounter.increment();
    }

    public void incrementCacheMissCounter() {
        cacheMissCounter.increment();
    }

    public void incrementDatabaseQueryErrorCounter() {
        databaseQueryErrorCounter.increment();
    }

    /**
     * Records the duration of a specific operation.
     * @param operationName The name of the operation.
     * @param duration The duration in milliseconds.
     */
    public void recordOperationDuration(String operationName, long duration) {
        Timer.builder("app.operation.duration")
                .description("Duration of various application operations")
                .tag("operation", operationName)
                .register(meterRegistry)
                .record(duration, TimeUnit.MILLISECONDS);
    }

    /**
     * Call this method when a user logs in.
     */
    public void userLoggedIn() {
        activeUsersGauge.incrementAndGet();
    }

    /**
     * Call this method when a user logs out.
     */
    public void userLoggedOut() {
        activeUsersGauge.decrementAndGet();
    }
}
```