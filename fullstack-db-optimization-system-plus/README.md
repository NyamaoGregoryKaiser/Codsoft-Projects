database-optimizer-system/
├── backend/
│   ├── src/
│   │   ├── main.cpp
│   │   ├── api/
│   │   │   ├── AuthMiddleware.h
│   │   │   ├── DbController.h
│   │   │   └── DbController.cpp
│   │   ├── services/
│   │   │   ├── AnalysisService.h
│   │   │   └── AnalysisService.cpp
│   │   │   ├── DataStorageService.h
│   │   │   └── DataStorageService.cpp
│   │   │   ├── DbMonitorService.h
│   │   │   └── DbMonitorService.cpp
│   │   ├── models/
│   │   │   ├── DbConfig.h
│   │   │   ├── Metric.h
│   │   │   └── Recommendation.h
│   │   ├── utils/
│   │   │   ├── ErrorHandler.h
│   │   │   └── Logger.h
│   │   ├── config/
│   │   │   └── AppConfig.h
│   │   └── db_schema.sql
│   ├── tests/
│   │   ├── unit/
│   │   │   └── AnalysisServiceTests.cpp
│   │   ├── integration/
│   │   │   └── DbControllerTests.cpp
│   ├── CMakeLists.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── run_tests.sh
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── DbConfigForm.js
│   │   │   ├── Header.js
│   │   │   ├── RecommendationCard.js
│   │   │   └── SlowQueryList.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   └── LoginPage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   └── styles/
│   │       └── App.css
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docs/
│   ├── README.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── .gitignore
└── LICENSE