```java
package com.tasksyncpro.tasksyncpro.util;

import com.tasksyncpro.tasksyncpro.service.MetricsService;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf44j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.Duration;
import java.time.Instant;

/**
 * Aspect for monitoring method execution performance.
 * It uses Micrometer to record method duration and logs the execution time.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class PerformanceMonitorAspect {

    private final MetricsService metricsService;
    private final io.micrometer.core.instrument.MeterRegistry meterRegistry; // Direct access for Timer

    /**
     * Custom annotation to mark methods for performance monitoring.
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface MonitorPerformance {
        String value() default ""; // Optional: custom name for the monitored operation
    }

    /**
     * Pointcut for methods annotated with @MonitorPerformance.
     */
    @Pointcut("@annotation(com.tasksyncpro.tasksyncpro.util.PerformanceMonitorAspect.MonitorPerformance)")
    public void monitorPerformancePointcut() {
        // Method is empty as this is just a Pointcut definition
    }

    /**
     * Around advice to measure and log method execution time, and record metrics.
     * @param joinPoint The proceeding join point.
     * @return The result of the method execution.
     * @throws Throwable if the method throws an exception.
     */
    @Around("monitorPerformancePointcut()")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        String operationName = joinPoint.getSignature().getName(); // Default operation name

        // Check if a custom name is provided in the annotation
        MonitorPerformance annotation = ((org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature())
                .getMethod().getAnnotation(MonitorPerformance.class);
        if (annotation != null && !annotation.value().isEmpty()) {
            operationName = annotation.value();
        }

        Instant start = Instant.now();
        log.debug("Entering method: {}", methodName);

        try {
            Object result = joinPoint.proceed();
            Instant end = Instant.now();
            long duration = Duration.between(start, end).toMillis();
            log.info("Exiting method: {}. Execution time: {} ms", methodName, duration);

            // Record duration using Micrometer Timer
            Timer.builder("app.method.duration")
                    .description("Execution time of application methods")
                    .tag("method", methodName)
                    .tag("operation", operationName)
                    .register(meterRegistry)
                    .record(duration, java.util.concurrent.TimeUnit.MILLISECONDS);

            return result;
        } catch (Throwable e) {
            Instant end = Instant.now();
            long duration = Duration.between(start, end).toMillis();
            log.error("Method: {} threw exception: {}. Execution time: {} ms", methodName, e.getMessage(), duration);

            // Record duration for failed execution (can be tagged differently if needed)
            Timer.builder("app.method.duration")
                    .description("Execution time of application methods (with errors)")
                    .tag("method", methodName)
                    .tag("operation", operationName)
                    .tag("status", "error")
                    .register(meterRegistry)
                    .record(duration, java.util.concurrent.TimeUnit.MILLISECONDS);

            throw e; // Re-throw the exception to maintain normal program flow
        }
    }
}
```