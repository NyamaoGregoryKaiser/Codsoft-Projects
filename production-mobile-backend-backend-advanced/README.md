mobile-backend-cpp/
├── src/
│   ├── main.cpp
│   ├── app.cpp
│   ├── app.h
│   ├── config/
│   │   ├── config.cpp
│   │   └── config.h
│   ├── controllers/
│   │   ├── base_controller.h
│   │   ├── auth_controller.cpp
│   │   ├── auth_controller.h
│   │   ├── task_controller.cpp
│   │   └── task_controller.h
│   ├── services/
│   │   ├── auth_service.cpp
│   │   ├── auth_service.h
│   │   ├── task_service.cpp
│   │   └── task_service.h
│   ├── repositories/
│   │   ├── db_manager.cpp
│   │   ├── db_manager.h
│   │   ├── user_repository.cpp
│   │   ├── user_repository.h
│   │   ├── task_repository.cpp
│   │   └── task_repository.h
│   ├── models/
│   │   ├── user.h
│   │   ├── task.h
│   │   └── json_serialization.h
│   ├── middleware/
│   │   ├── auth_middleware.cpp
│   │   ├── auth_middleware.h
│   │   ├── error_middleware.cpp
│   │   ├── error_middleware.h
│   │   ├── logging_middleware.cpp
│   │   ├── logging_middleware.h
│   │   ├── rate_limit_middleware.cpp
│   │   └── rate_limit_middleware.h
│   ├── utils/
│   │   ├── jwt_utils.cpp
│   │   ├── jwt_utils.h
│   │   ├── crypto_utils.cpp
│   │   ├── crypto_utils.h
│   │   ├── logger.cpp
│   │   └── logger.h
│   ├── cache/
│   │   ├── cache.cpp
│   │   └── cache.h
│   └── exceptions/
│       ├── http_exception.h
│       └── auth_exception.h
├── tests/
│   ├── CMakeLists.txt
│   ├── unit/
│   │   ├── test_config.cpp
│   │   ├── test_models.cpp
│   │   ├── test_utils.cpp
│   │   └── test_services.cpp
│   ├── integration/
│   │   └── test_repositories.cpp
│   └── api/
│       └── test_api.cpp
├── database/
│   ├── schema.sql
│   ├── seed.sql
├── docs/
│   ├── architecture.md
│   ├── api.yaml
│   └── deployment.md
├── .env.example
├── CMakeLists.txt
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── README.md
├── requirements.txt # For API testing with Python's requests if desired