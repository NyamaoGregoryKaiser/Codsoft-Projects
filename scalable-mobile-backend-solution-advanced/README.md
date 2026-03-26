Project Structure:
.
├── CMakeLists.txt
├── .env.example
├── ci-cd/
│   └── github-actions.yml
├── config/
│   └── drogon_config.json
├── database/
│   ├── migrations/
│   │   ├── V1__initial_schema.sql
│   │   └── V2__seed_data.sql
│   └── README.md
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/
│   ├── API_DOCS.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── README.md
├── src/
│   ├── main.cc
│   ├── config/
│   │   ├── ConfigManager.h
│   │   └── ConfigManager.cc
│   ├── controllers/
│   │   ├── AuthController.h
│   │   ├── AuthController.cc
│   │   ├── OrderController.h
│   │   ├── OrderController.cc
│   │   ├── ProductController.h
│   │   ├── ProductController.cc
│   │   ├── RootController.h
│   │   └── RootController.cc
│   │   ├── UserController.h
│   │   └── UserController.cc
│   ├── database/
│   │   ├── DBManager.h
│   │   └── DBManager.cc
│   ├── filters/
│   │   ├── AuthFilter.h
│   │   ├── AuthFilter.cc
│   │   ├── RateLimitFilter.h
│   │   └── RateLimitFilter.cc
│   ├── models/
│   │   ├── Order.h
│   │   ├── Product.h
│   │   └── User.h
│   ├── repositories/
│   │   ├── OrderRepository.h
│   │   ├── OrderRepository.cc
│   │   ├── ProductRepository.h
│   │   ├── ProductRepository.cc
│   │   ├── UserRepository.h
│   │   └── UserRepository.cc
│   ├── services/
│   │   ├── AuthService.h
│   │   ├── AuthService.cc
│   │   ├── CacheService.h
│   │   ├── CacheService.cc
│   │   ├── OrderService.h
│   │   ├── OrderService.cc
│   │   ├── ProductService.h
│   │   ├── ProductService.cc
│   │   ├── UserService.h
│   │   └── UserService.cc
│   └── utils/
│       ├── Common.h
│       ├── JwtManager.h
│       ├── JwtManager.cc
│       ├── Logger.h
│       ├── Logger.cc
│       ├── PasswordHasher.h
│       └── PasswordHasher.cc
└── tests/
    ├── CMakeLists.txt
    ├── integration/
    │   ├── test_auth_integration.cc
    │   └── test_user_integration.cc
    └── unit/
        ├── test_config_manager.cc
        ├── test_jwt_manager.cc
        ├── test_password_hasher.cc
        └── test_repository_mocks.cc