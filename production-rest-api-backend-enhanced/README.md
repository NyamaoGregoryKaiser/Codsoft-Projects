/enterprise-project-manager
├── backend/
│   ├── src/
│   │   ├── config/              # Environment-specific configurations
│   │   ├── database/            # TypeORM setup, entities, migrations, seeds
│   │   │   ├── entities/        # Database entities (User, Project, Task)
│   │   │   ├── migrations/      # TypeORM migration files
│   │   │   └── seeds/           # Seed data for initial setup
│   │   ├── middleware/          # Custom Express middleware (auth, error, logging, rate limit, cache)
│   │   ├── modules/             # Feature modules (auth, projects, tasks, users)
│   │   │   ├── auth/            # Authentication logic, JWT
│   │   │   ├── projects/        # Project CRUD operations
│   │   │   ├── tasks/           # Task CRUD operations
│   │   │   └── users/           # User CRUD operations
│   │   ├── utils/               # Utility functions (logger, response handlers)
│   │   ├── app.ts               # Main Express application setup
│   │   └── server.ts            # Entry point to start the server
│   ├── tests/                   # Unit and integration tests for backend
│   ├── .env.example             # Example environment variables
│   ├── Dockerfile               # Dockerfile for backend service
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json             # Backend dependencies and scripts
├── frontend/
│   ├── public/                  # Public assets
│   ├── src/
│   │   ├── api/                 # Axios instance and API calls
│   │   ├── assets/              # Images, icons
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React Context API for global state (e.g., Auth)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Top-level application pages
│   │   ├── utils/               # Frontend utility functions
│   │   ├── App.js               # Main React application component
│   │   ├── index.js             # React entry point
│   │   └── reportWebVitals.js   # CRA web vitals report
│   ├── tests/                   # Unit and integration tests for frontend
│   ├── .env.example             # Example environment variables
│   ├── Dockerfile               # Dockerfile for frontend service
│   └── package.json             # Frontend dependencies and scripts
├── .env.example                 # Root example environment variables
├── docker-compose.yml           # Docker Compose for multi-service setup (backend, frontend, DB)
├── .github/                     # GitHub Actions CI/CD configuration
│   └── workflows/
│       └── main.yml
├── ARCHITECTURE.md              # Architecture overview and design decisions
├── API_DOCUMENTATION.md         # API endpoint documentation (OpenAPI/Swagger)
├── DEPLOYMENT_GUIDE.md          # Guide for deploying the application
├── PERFORMANCE_TESTS.md         # Guide for setting up and running performance tests
├── README.md                    # Comprehensive project README
└── package.json                 # Root workspace package.json (for shared scripts, if using monorepo tools)