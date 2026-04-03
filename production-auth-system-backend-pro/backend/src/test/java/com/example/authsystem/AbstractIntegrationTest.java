```java
package com.example.authsystem;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RedisContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for integration tests that require a PostgreSQL database and Redis.
 * Uses Testcontainers to spin up ephemeral database instances.
 */
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    protected static PostgreSQLContainer<?> postgresContainer = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
            .withDatabaseName("test_db")
            .withUsername("testuser")
            .withPassword("testpassword");

    @Container
    protected static RedisContainer redisContainer = new RedisContainer(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);


    /**
     * Dynamically sets Spring properties to connect to the Testcontainers instances.
     */
    @DynamicPropertySource
    static void setTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgresContainer::getUsername);
        registry.add("spring.datasource.password", postgresContainer::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create"); // Ensure schema is created for tests
        registry.add("spring.flyway.enabled", () -> "true"); // Enable Flyway for tests
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");

        registry.add("spring.redis.host", redisContainer::getHost);
        registry.add("spring.redis.port", () -> redisContainer.getMappedPort(6379).toString());
        registry.add("jwt.secret", () -> "a_very_long_and_secure_secret_for_tests_that_is_at_least_256_bits_long");
        registry.add("jwt.expiration", () -> "3600000"); // 1 hour for tests
    }
}
```