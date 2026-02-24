AppMonitor/
├── .github/                           # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── main.yml
├── backend/                           # Node.js Express API
│   ├── src/
│   │   ├── config/                    # Environment, database, Redis configurations
│   │   ├── db/                        # Knex migrations and seeds
│   │   ├── middleware/                # Auth, error handling, logging, rate limiting
│   │   ├── models/                    # Database interaction layer (Knex)
│   │   ├── services/                  # Business logic
│   │   ├── routes/                    # API route definitions
│   │   ├── controllers/               # Route handlers
│   │   ├── utils/                     # Utility functions (JWT, password hashing)
│   │   ├── tests/                     # Unit and Integration tests
│   │   ├── app.js                     # Express app instance
│   │   └── server.js                  # Application entry point
│   ├── .env.example                   # Example environment variables
│   ├── Dockerfile                     # Dockerfile for backend service
│   ├── package.json                   # Backend dependencies and scripts
│   └── README.md                      # Backend specific documentation
├── frontend/                          # React web application
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── assets/                    # Images, icons
│   │   ├── components/                # Reusable React components
│   │   ├── pages/                     # Page-level components (Dashboard, Login, etc.)
│   │   ├── api/                       # API client for backend communication
│   │   ├── contexts/                  # React Context API for global state (e.g., Auth)
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── utils/                     # Frontend utility functions
│   │   ├── tests/                     # Unit tests for React components
│   │   ├── App.js                     # Main application component
│   │   └── index.js                   # Entry point for React app
│   ├── Dockerfile                     # Dockerfile for frontend service
│   ├── package.json                   # Frontend dependencies and scripts
│   └── README.md                      # Frontend specific documentation
├── k6/                                # Performance test scripts
│   └── performance-test.js
├── docker-compose.yml                 # Orchestrates services (backend, frontend, db, redis)
├── API.md                             # API Documentation (OpenAPI/Swagger conceptual)
├── ARCHITECTURE.md                    # Architecture overview
├── DEPLOYMENT.md                      # Deployment guide
└── README.md                          # Main project README, setup instructions