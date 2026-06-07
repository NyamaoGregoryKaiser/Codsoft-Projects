```java
package com.example.authsystem.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                contact = @Contact(
                        name = "Support Team",
                        email = "support@example.com",
                        url = "https://example.com/support"
                ),
                description = "OpenAPI documentation for a production-ready authentication system.",
                title = "Authentication System API",
                version = "1.0",
                license = @License(
                        name = "MIT License",
                        url = "https://opensource.org/licenses/MIT"
                ),
                termsOfService = "https://example.com/terms"
        ),
        servers = {
                @Server(
                        description = "Local DEV Server",
                        url = "http://localhost:8080"
                ),
                @Server(
                        description = "Production Server",
                        url = "https://api.yourdomain.com"
                )
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT authentication using a Bearer token. Prefix the token with 'Bearer ' (e.g., 'Bearer abc.xyz.123')",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = io.swagger.v3.oas.annotations.enums.SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
```