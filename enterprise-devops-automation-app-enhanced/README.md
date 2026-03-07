project-management-system/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD Pipeline
├── backend/
│   ├── src/
│   │   ├── config/               # DB, Redis, Logger configurations
│   │   ├── middleware/           # Auth, Error, Rate Limiting, Logger Middleware
│   │   ├── models/               # Sequelize ORM models (User, Project, Task, Comment)
│   │   ├── migrations/           # Database schema migrations
│   │   ├── seeders/              # Database seed data
│   │   ├── controllers/          # Business logic handlers for API routes
│   │   ├── routes/               # Express API routes
│   │   ├── services/             # Abstraction for complex business logic
│   │   ├── utils/                # Utility functions (JWT, validators)
│   │   ├── app.js                # Express app setup
│   │   └── server.js             # Server entry point
│   ├── tests/                    # Backend unit, integration, API tests
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile                # Dockerfile for backend service
│   └── jest.config.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                  # API client services
│   │   ├── components/           # Reusable UI components
│   │   ├── contexts/             # React Context for global state (e.g., Auth)
│   │   ├── pages/                # Page-level components
│   │   ├── App.js                # Main application component
│   │   └── index.js              # React app entry point
│   ├── tests/                    # Frontend unit tests
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile                # Dockerfile for frontend service
├── docs/
│   ├── README.md                 # Comprehensive project README
│   ├── ARCHITECTURE.md           # System architecture overview
│   ├── API.md                    # API endpoint documentation
│   └── DEPLOYMENT.md             # Deployment guide
├── docker-compose.yml            # Defines multi-container Docker application
└── .gitignore