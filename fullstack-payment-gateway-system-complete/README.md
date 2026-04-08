payment-system/
├── backend/
│   ├── src/
│   │   ├── auth/                 # Authentication (JWT)
│   │   ├── common/               # Shared DTOs, constants, decorators, middleware, filters
│   │   ├── config/               # Environment and application configuration
│   │   ├── database/             # TypeORM entities, migrations
│   │   ├── merchants/            # Merchant management (CRUD)
│   │   ├── payment-methods/      # Abstracted payment method storage
│   │   ├── transactions/         # Core payment processing logic (capture, refund, void)
│   │   ├── users/                # System user management
│   │   ├── webhooks/             # Webhook subscription and dispatch
│   │   ├── reporting/            # Basic reporting module
│   │   ├── app.module.ts         # Root NestJS module
│   │   └── main.ts               # Application entry point
│   ├── test/                     # Backend unit, integration, and E2E tests
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                  # Axios instance and API client functions
│   │   ├── assets/
│   │   ├── components/           # Reusable UI components
│   │   ├── contexts/             # React Contexts (e.g., AuthContext)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Page-level components (Login, Dashboard, Transactions etc.)
│   │   ├── services/             # Business logic / data fetching
│   │   ├── types/                # Shared TypeScript types
│   │   ├── utils/                # Utility functions
│   │   ├── App.tsx               # Main application component
│   │   └── main.tsx              # Entry point
│   ├── test/                     # Frontend unit/component tests
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts            # Vite configuration
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   └── .env                      # Docker environment variables
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.gyml
├── docs/                         # Additional architectural diagrams, deployment specifics
├── .gitignore
└── README.md