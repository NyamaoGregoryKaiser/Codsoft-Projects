.
├── backend/
│   ├── src/
│   │   ├── config/              # Application configurations (DB, Redis, Auth, Puppeteer, Logger)
│   │   ├── db/                  # Database layer (models, migrations, seeders)
│   │   │   ├── models/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   ├── middlewares/         # Express middleware (auth, error handling, rate limiting, caching)
│   │   ├── routes/              # API route definitions
│   │   ├── controllers/         # Request handlers, orchestrate services
│   │   ├── services/            # Core business logic (auth, user, target, scraping, job scheduling)
│   │   ├── utils/               # Utility functions (logger, Redis client, JWT helper)
│   │   ├── workers/             # BullMQ job consumers
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Application entry point
│   ├── tests/                   # Unit, integration, and API tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── api/
│   ├── .env.example             # Example environment variables
│   ├── package.json
│   ├── Dockerfile
│   └── .sequelizerc             # Sequelize CLI configuration
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                 # Axios client and API calls
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React Context for global state (e.g., Auth)
│   │   ├── pages/               # Page-level components (Login, Dashboard, Targets, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Frontend utility functions
│   │   ├── App.js               # Main application component
│   │   └── index.js             # Entry point for React app
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml           # Docker Compose for multi-service setup
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions CI/CD pipeline configuration
├── docs/
│   ├── README.md                # Comprehensive project README
│   ├── ARCHITECTURE.md          # System architecture documentation
│   ├── API.md                   # API endpoint documentation
│   └── DEPLOYMENT.md            # Deployment guide
└── package.json                 # Root package.json (for workspaces or just informational)