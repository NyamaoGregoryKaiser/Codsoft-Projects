backend/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/dataviz/datavisualizationtool/
    │   │   ├── config/              # Security, Cache, RateLimit, Swagger configurations
    │   │   ├── controller/          # REST API endpoints
    │   │   ├── dto/                 # Data Transfer Objects
    │   │   ├── entity/              # JPA Entities
    │   │   ├── exception/           # Custom exceptions and global handler
    │   │   ├── repository/          # Spring Data JPA repositories
    │   │   ├── service/             # Business logic
    │   │   ├── security/            # JWT authentication and authorization components
    │   │   ├── util/                # Utility classes
    │   │   └── DataVisualizationToolApplication.java # Main application class
    │   └── resources/
    │       ├── application.yml      # Spring Boot configuration
    │       ├── db/migration/        # Flyway migration scripts
    │       └── logback-spring.xml   # Logging configuration
    └── test/
        └── java/com/dataviz/datavisualizationtool/
            ├── controller/
            ├── service/
            └── repository/