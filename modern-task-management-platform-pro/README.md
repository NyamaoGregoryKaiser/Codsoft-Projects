task-management-system/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment-specific configurations (DB, JWT, Redis)
│   │   ├── database/            # TypeORM entities, migrations, data source setup
│   │   ├── middleware/          # Express middleware (auth, error, logging, rate limiting, caching, validation)
│   │   ├── modules/             # Feature-specific modules (Auth, Users, Projects, Tasks, Comments)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── comments/
│   │   │   └── .../             # Each module contains controllers, services, dtos, routes
│   │   ├── utils/               # Utility functions (logger, custom errors, api responses, pagination)
│   │   ├── types/               # Custom TypeScript types and interfaces
│   │   ├── app.ts               # Express application setup
│   │   ├── server.ts            # Application entry point
│   ├── tests/                   # Unit, integration, and API tests
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── ormconfig.ts             # TypeORM CLI configuration
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                 # API client functions (Axios setup)
│   │   ├── assets/              # Static assets (images, icons)
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React Context API for global state (AuthContext)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Top-level page components (Login, Dashboard, Project, Task)
│   │   ├── types/               # Frontend-specific TypeScript types
│   │   ├── utils/               # Frontend utility functions
│   │   ├── App.tsx              # Main React application component
│   │   ├── index.tsx            # React app entry point
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions CI/CD pipeline configuration
├── docs/
│   ├── architecture.md          # System architecture overview
│   ├── api.md                   # API documentation (endpoints, requests, responses)
│   └── deployment.md            # Deployment guide
├── docker-compose.yml           # Docker setup for all services (backend, frontend, db, redis)
├── README.md                    # Comprehensive project README
└── .gitignore