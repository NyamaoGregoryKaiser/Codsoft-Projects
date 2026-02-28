SecureTaskHub/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, DB, app configurations
│   │   ├── controllers/        # Handle request/response logic
│   │   ├── middleware/         # Auth, validation, error, logging, rate limiting, caching
│   │   ├── models/             # Sequelize models (User, Project, Task)
│   │   ├── migrations/         # Database schema changes
│   │   ├── seeders/            # Initial data
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helper functions (JWT, Hashing, Logger, Cache)
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── tests/                  # Backend tests (unit, integration)
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   └── README.md (backend specific)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                # API client
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React Context for global state (Auth)
│   │   ├── pages/              # Route-specific components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── styles/             # Global styles
│   │   ├── utils/              # Frontend utilities
│   │   ├── App.js              # Main application component
│   │   └── index.js            # React app entry point
│   ├── tests/                  # Frontend tests (unit, component)
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   └── README.md (frontend specific)
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions workflow
├── docker-compose.yml          # Orchestrates backend, frontend, db
├── .gitignore
└── README.md                   # Main project README