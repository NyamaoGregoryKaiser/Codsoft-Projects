package com.authsystem.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Global configuration for OpenAPI (Swagger UI).
 * Defines API metadata, servers, and security schemes (JWT).
 * Access at: http://localhost:8080/swagger-ui.html
 */
@OpenAPIDefinition(
        info = @Info(
                title = "Authentication System API",
                version = "1.0",
                description = "API documentation for a production-ready Authentication System.",
                termsOfService = "http://swagger.io/terms/",
                contact = @Contact(
                        name = "Support Team",
                        email = "support@authsystem.com"
                ),
                license = @License(
                        name = "Apache 2.0",
                        url = "http://www.apache.org/licenses/LICENSE-2.0.html"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local Development Server"),
                @Server(url = "https://your-production-url.com", description = "Production Server")
        },
        security = {
                @SecurityRequirement(name = "bearerAuth") // Applies this security scheme globally
        }
)
@SecurityScheme(
        name = "bearerAuth", // Must match the name in @SecurityRequirement
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "JWT authentication token. Please enter your token in the format: Bearer <token>"
)
@Configuration
public class OpenApiConfig {
    // This class primarily uses annotations for configuration.
}