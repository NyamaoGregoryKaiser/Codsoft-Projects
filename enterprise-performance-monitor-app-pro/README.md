.
├── backend/
│   ├── src/
│   │   ├── config/                     # Environment, database, winston setup
│   │   ├── database/                   # TypeORM data source, migrations, seeds
│   │   ├── entities/                   # TypeORM entity definitions
│   │   ├── middleware/                 # Express middleware (auth, error, logger, rateLimit, cache)
│   │   ├── routes/                     # API route definitions
│   │   ├── services/                   # Business logic, interaction with repositories
│   │   ├── controllers/                # Handle HTTP requests, call services
│   │   ├── utils/                      # Helper functions (JWT, password, validation)
│   │   ├── types/                      # Custom TypeScript types/interfaces
│   │   ├── app.ts                      # Express app setup
│   │   └── server.ts                   # Application entry point
│   ├── tests/
│   │   ├── unit/                       # Unit tests for services, utils
│   │   ├── integration/                # Integration tests for controllers, services with DB
│   │   └── api/                        # API tests using Supertest
│   ├── .env.example
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── package.json
│   └── ormconfig.ts                    # TypeORM CLI config
├── frontend/
│   ├── src/
│   │   ├── api/                        # Axios configurations and API service calls
│   │   ├── components/                 # Reusable React components (UI, layout, charts)
│   │   ├── context/                    # React Context API for global state (e.g., Auth)
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── pages/                      # Top-level page components (views)
│   │   ├── utils/                      # Frontend utility functions
│   │   ├── types/                      # Frontend specific types
│   │   ├── styles/                     # Tailwind CSS entry point
│   │   ├── App.tsx                     # Main application component, router setup
│   │   └── index.tsx                   # React app entry point
│   ├── public/
│   ├── Dockerfile
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── README.md                       # Comprehensive setup and project details
│   ├── API_DOCUMENTATION.md            # API endpoints, request/response formats
│   ├── ARCHITECTURE.md                 # System architecture overview
│   └── DEPLOYMENT.md                   # Deployment steps
├── docker-compose.yml                  # Docker orchestration
└── .github/
    └── workflows/
        └── ci-cd.yml                   # GitHub Actions for CI/CD