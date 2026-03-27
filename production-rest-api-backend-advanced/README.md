pms-api/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app initialization
│   │   ├── server.ts              # Server entry point
│   │   ├── config/                # Environment variables, DB config
│   │   │   ├── index.ts
│   │   │   └── logger.ts
│   │   ├── db/                    # TypeORM setup
│   │   │   ├── data-source.ts
│   │   │   ├── migrations/        # Database migration scripts
│   │   │   │   └── 1701010000000-InitialSchema.ts
│   │   │   └── seeds/             # Seed data scripts
│   │   │       └── initial.ts
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.ts            # JWT authentication & authorization
│   │   │   ├── errorHandler.ts    # Centralized error handling
│   │   │   ├── cache.ts           # Caching middleware
│   │   │   └── rateLimiter.ts     # Rate limiting middleware
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/              # User authentication (login, register)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.dtos.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── projects/          # Project management
│   │   │   │   ├── project.controller.ts
│   │   │   │   ├── project.dtos.ts
│   │   │   │   ├── project.entity.ts
│   │   │   │   ├── project.repository.ts
│   │   │   │   ├── project.routes.ts
│   │   │   │   └── project.service.ts
│   │   │   ├── tasks/             # Task management within projects
│   │   │   │   ├── task.controller.ts
│   │   │   │   ├── task.dtos.ts
│   │   │   │   ├── task.entity.ts
│   │   │   │   ├── task.repository.ts
│   │   │   │   ├── task.routes.ts
│   │   │   │   └── task.service.ts
│   │   │   └── users/             # User management (admin only)
│   │   │       ├── user.controller.ts
│   │   │       ├── user.dtos.ts
│   │   │       ├── user.entity.ts
│   │   │       ├── user.repository.ts
│   │   │       ├── user.routes.ts
│   │   │       └── user.service.ts
│   │   ├── types/                 # Custom type definitions
│   │   │   └── express.d.ts
│   │   └── utils/                 # Utility functions
│   │       ├── apiError.ts        # Custom API error classes
│   │       ├── jwt.ts             # JWT token handling
│   │       └── password.ts        # Password hashing
│   ├── tests/
│   │   ├── integration/
│   │   │   ├── auth.test.ts
│   │   │   ├── project.test.ts
│   │   │   └── user.test.ts
│   │   ├── unit/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── project.service.test.ts
│   │   │   ├── user.service.test.ts
│   │   │   └── utils/
│   │   │       ├── jwt.test.ts
│   │   │       └── password.test.ts
│   ├── .env.example
│   ├── Dockerfile                 # Dockerfile for backend app
│   ├── jest.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── tsoa.json                  # For Swagger generation (not fully automated here, but conceptual)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.ts                 # Axios client
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── Auth.tsx           # Login/Register page
│   │   │   └── Projects.tsx       # Projects list/create page
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── .github/                       # CI/CD pipeline
│   └── workflows/
│       └── main.yml               # GitHub Actions workflow
├── docker-compose.yml             # Docker Compose for all services
├── docs/
│   ├── API_DOCUMENTATION.md       # API endpoints, request/response formats
│   ├── ARCHITECTURE.md            # System architecture, tech stack
│   └── DEPLOYMENT_GUIDE.md        # Deployment instructions
└── README.md                      # Project setup, usage, scripts