server/
├── CMakeLists.txt
├── src/
│   ├── main.cpp
│   ├── config/
│   │   └── AppConfig.h
│   ├── auth/
│   │   ├── AuthManager.h
│   │   └── AuthManager.cpp
│   ├── middleware/
│   │   ├── AuthMiddleware.h
│   │   └── ErrorMiddleware.h
│   ├── db/
│   │   ├── DBManager.h
│   │   └── DBManager.cpp
│   │   └── SQLQueries.h  // Raw SQL queries or ORM models
│   ├── handlers/
│   │   ├── UserHandler.h
│   │   ├── UserHandler.cpp
│   │   ├── DatasetHandler.h
│   │   ├── DatasetHandler.cpp
│   │   ├── DashboardHandler.h
│   │   └── DashboardHandler.cpp
│   ├── services/
│   │   ├── DatasetService.h
│   │   └── DatasetService.cpp
│   │   └── DataProcessingService.h // For data transformations
│   ├── models/
│   │   ├── User.h
│   │   ├── Dataset.h
│   │   └── Dashboard.h
│   ├── utils/
│   │   ├── Logger.h
│   │   ├── Cache.h
│   │   ├── RateLimiter.h
│   │   └── JWTUtils.h
│   └── common/
│       ├── Error.h
│       └── Constants.h
└── tests/
    ├── CMakeLists.txt
    ├── TestAuth.cpp
    ├── TestDB.cpp
    └── TestDatasetService.cpp