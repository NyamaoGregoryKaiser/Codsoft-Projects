```java
package com.taskflow.util;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PerformanceAspect {

    private final MeterRegistry meterRegistry; // Micrometer registry for Prometheus

    @Around("execution(* com.taskflow..*Service.*(..)) || execution(* com.taskflow..*Controller.*(..))")
    public Object measureMethodPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.debug("Method '{}' executed in {}ms", methodName, duration);

            // Publish custom metric to Prometheus
            meterRegistry.timer("app.method.duration",
                            "class", joinPoint.getSignature().getDeclaringTypeName(),
                            "method", joinPoint.getSignature().getName(),
                            "type", "success")
                    .record(duration, java.util.concurrent.TimeUnit.MILLISECONDS);

            return result;
        } catch (Throwable e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Method '{}' failed in {}ms with error: {}", methodName, duration, e.getMessage());

            // Publish custom error metric
            meterRegistry.timer("app.method.duration",
                            "class", joinPoint.getSignature().getDeclaringTypeName(),
                            "method", joinPoint.getSignature().getName(),
                            "type", "failure")
                    .record(duration, java.util.concurrent.TimeUnit.MILLISECONDS);

            meterRegistry.counter("app.method.errors",
                            "class", joinPoint.getSignature().getDeclaringTypeName(),
                            "method", joinPoint.getSignature().getName())
                    .increment();

            throw e; // Re-throw the exception to maintain original flow
        }
    }
}
```