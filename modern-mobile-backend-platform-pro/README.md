mobile-backend/
├── src/
│   ├── main.cc                         # Application entry point
│   ├── controllers/
│   │   ├── BaseController.h            # Base for common controller functionality
│   │   ├── AuthController.h
│   │   ├── AuthController.cc
│   │   ├── UserController.h
│   │   ├── UserController.cc
│   │   ├── ProductController.h
│   │   ├── ProductController.cc
│   │   ├── OrderController.h
│   │   └── OrderController.cc
│   ├── services/
│   │   ├── AuthService.h
│   │   ├── AuthService.cc
│   │   ├── UserService.h
│   │   ├── UserService.cc
│   │   ├── ProductService.h
│   │   ├── ProductService.cc
│   │   ├── OrderService.h
│   │   └── OrderService.cc
│   ├── models/
│   │   ├── User.h                      # Data Transfer Objects/Entities
│   │   ├── Product.h
│   │   ├── Order.h
│   │   ├── OrderItem.h
│   │   └── DTOs.h                      # Common DTOs like LoginRequest, RegisterRequest etc.
│   ├── dao/
│   │   ├── BaseDAO.h                   # Base for common DB operations
│   │   ├── BaseDAO.cc
│   │   ├── UserDAO.h
│   │   ├── UserDAO.cc
│   │   ├── ProductDAO.h
│   │   ├── ProductDAO.cc
│   │   ├── OrderDAO.h
│   │   └── OrderDAO.cc
│   ├── utils/
│   │   ├── AppConfig.h                 # Configuration management
│   │   ├── AppConfig.cc
│   │   ├── Logger.h                    # spdlog wrapper
│   │   ├── Logger.cc
│   │   ├── JWTUtils.h                  # JWT generation/validation
│   │   ├── JWTUtils.cc
│   │   ├── PasswordUtils.h             # Password hashing/verification
│   │   ├── PasswordUtils.cc
│   │   ├── Cache.h                     # Simple in-memory cache
│   │   ├── Cache.cc
│   │   ├── RateLimiter.h               # Simple in-memory rate limiter
│   │   └── RateLimiter.cc
│   ├── middleware/
│   │   ├── AuthMiddleware.h            # JWT authentication middleware
│   │   ├── AuthMiddleware.cc
│   │   ├── ErrorHandlingMiddleware.h   # Global error handler
│   │   ├── ErrorHandlingMiddleware.cc
│   │   ├── RateLimitingMiddleware.h    # Rate limiting middleware
│   │   └── RateLimitingMiddleware.cc
│   └── exceptions/
│       ├── ApiException.h              # Custom exception base
│       └── ApiException.cc
├── CMakeLists.txt                      # Build configuration for Drogon
├── Doxyfile                            # Doxygen configuration (for code documentation)
├── tests/
│   ├── CMakeLists.txt                  # Build configuration for tests
│   ├── unit/
│   │   ├── TestPasswordUtils.cc
│   │   ├── TestJWTUtils.cc
│   │   └── TestAppConfig.cc
│   ├── integration/
│   │   └── TestDAOsIntegration.cc      # Tests DAOs with a real (test) database
│   └── api/
│       └── TestAuthAPI.cc              # Uses Drogon's HttpClient to test API endpoints
├── db/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_add_foreign_keys.sql
│   │   └── 003_add_order_items.sql
│   └── seed/
│       └── seed_data.sql
├── config/
│   ├── default.json                    # Default application configuration
│   └── environments/
│       ├── development.json
│       └── production.json
├── .env.example                        # Example for environment variables
├── Dockerfile                          # Dockerfile for building the application image
├── docker-compose.yml                  # Docker Compose for multi-service setup (app + db)
├── .gitignore
├── README.md                           # Comprehensive project documentation
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions CI/CD pipeline
└── swagger.yaml                        # OpenAPI / Swagger specification