zenith-payments/
├── src/
│   ├── main.cpp                     # Entry point for the C++ application
│   ├── config/
│   │   ├── config.hpp               # Configuration definitions
│   │   └── config.cpp
│   ├── database/
│   │   ├── db_connection.hpp        # Database connection manager
│   │   ├── db_connection.cpp
│   │   ├── repositories/
│   │   │   ├── user_repository.hpp
│   │   │   ├── user_repository.cpp
│   │   │   ├── payment_method_repository.hpp
│   │   │   ├── payment_method_repository.cpp
│   │   │   ├── transaction_repository.hpp
│   │   │   └── transaction_repository.cpp
│   ├── models/
│   │   ├── user.hpp                 # User data model
│   │   ├── payment_method.hpp       # Payment method data model
│   │   └── transaction.hpp          # Transaction data model
│   ├── services/
│   │   ├── user_service.hpp         # Business logic for users
│   │   ├── user_service.cpp
│   │   ├── payment_method_service.hpp # Business logic for payment methods
│   │   ├── payment_method_service.cpp
│   │   ├── transaction_service.hpp  # Core transaction processing logic
│   │   ├── transaction_service.cpp
│   │   ├── payment_gateway_integrator.hpp # Handles external gateway communication
│   │   └── payment_gateway_integrator.cpp
│   ├── api/
│   │   ├── auth_middleware.hpp      # Authentication middleware
│   │   ├── rate_limiter_middleware.hpp # Rate limiting middleware
│   │   ├── error_handler.hpp        # Global error handling
│   │   ├── routes.hpp               # Defines API routes and handlers
│   │   └── routes.cpp
│   ├── utils/
│   │   ├── logger.hpp               # Logging utility
│   │   ├── jwt_manager.hpp          # JWT generation/verification
│   │   ├── cache_manager.hpp        # Caching utility
│   │   └── common.hpp               # Common utilities/typedefs
│   └── third_party/                 # Placeholder for external libraries managed by CMake
│       └── ...
├── build/                           # Compiled binaries and artifacts (gitignored)
├── tests/
│   ├── unit/
│   │   ├── user_service_test.cpp
│   │   └── transaction_service_test.cpp
│   ├── integration/
│   │   ├── db_repository_test.cpp
│   │   └── api_integration_test.cpp
│   └── performance/                 # Placeholder for performance test scripts
├── docker/
│   ├── Dockerfile                   # Dockerfile for the application
│   ├── docker-compose.yml           # Docker Compose for app + DB + Redis
│   └── scripts/
│       ├── wait-for-it.sh           # Script to wait for services
│       └── entrypoint.sh            # Entrypoint for the application container
├── database/
│   ├── schema.sql                   # Initial database schema
│   ├── migrations/                  # Database migration scripts
│   │   ├── 001_create_users_table.sql
│   │   └── 002_create_transactions_table.sql
│   └── seed_data.sql                # Initial seed data
├── docs/
│   ├── README.md                    # Main project README
│   ├── API.md                       # API documentation (OpenAPI/Swagger format)
│   ├── ARCHITECTURE.md              # Architecture overview
│   └── DEPLOYMENT.md                # Deployment guide
├── .env.example                     # Example environment variables
├── .gitignore
├── CMakeLists.txt                   # CMake build configuration
├── CONTRIBUTING.md
├── LICENSE
├── ci/
│   └── github_actions.yml           # GitHub Actions CI/CD pipeline config
└── tools/                           # Scripts for development/admin tasks
    └── setup_db.sh