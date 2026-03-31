package com.authsystem.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    /**
     * Configures and initializes Flyway for database migrations.
     * This bean ensures that migrations run automatically when the application starts.
     */
    @Bean
    public Flyway flyway() {
        Flyway flyway = Flyway.configure()
                .dataSource(datasourceUrl, datasourceUsername, datasourcePassword)
                .locations("classpath:/db/migration") // Location of migration scripts
                .load();
        flyway.migrate(); // Apply outstanding migrations
        return flyway;
    }
}