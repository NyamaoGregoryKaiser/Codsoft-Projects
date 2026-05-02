.
├── .github/                       # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml
├── backend/                       # Node.js/Express API
│   ├── src/
│   │   ├── config/                # Environment, DB, Redis config
│   │   ├── controllers/           # Handle request/response
│   │   ├── middleware/            # Auth, error, cache, rate limiting, logging
│   │   ├── models/                # Sequelize models
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic, data access
│   │   ├── utils/                 # JWT, logger utilities
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # Entry point
│   ├── migrations/                # Database migration scripts
│   ├── seeders/                   # Database seed data scripts
│   ├── tests/                     # Unit and integration tests
│   ├── .env.example               # Example environment variables
│   ├── Dockerfile                 # Docker build instructions
│   ├── package.json               # Backend dependencies and scripts
│   └── .sequelizerc               # Sequelize CLI config
├── frontend/                      # React SPA
│   ├── public/
│   ├── src/
│   │   ├── api/                   # Axios instance for API calls
│   │   ├── components/            # Reusable UI components
│   │   ├── contexts/              # React Context for global state (e.g., Auth)
│   │   ├── pages/                 # Main application pages
│   │   ├── App.js                 # Main React application
│   │   ├── index.css              # Global styles
│   │   └── index.js               # React entry point
│   ├── tests/                     # Frontend tests (not fully implemented due to size, but structure present)
│   ├── .env.example               # Example environment variables
│   ├── Dockerfile                 # Docker build instructions
│   ├── nginx.conf                 # Nginx configuration for serving React app
│   └── package.json               # Frontend dependencies and scripts
├── docker-compose.yml             # Local development environment setup
├── k6-performance-test.js         # K6 performance test script
├── API.md                         # Detailed API documentation
├── ARCHITECTURE.md                # System architecture overview
├── DEPLOYMENT.md                  # Deployment guide
└── README.md                      # Project overview, setup, usage