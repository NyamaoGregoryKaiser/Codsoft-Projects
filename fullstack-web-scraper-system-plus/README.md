web-scraper-system/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, DB, Redis, etc.
│   │   ├── controllers/        # Handle API requests (Users, ScrapeJobs, ScrapedData)
│   │   ├── services/           # Business logic (Auth, ScrapeJob, Scraper, Cache)
│   │   ├── repositories/       # TypeORM repositories for entities
│   │   ├── entities/           # TypeORM entity definitions (User, ScrapeJob, ScrapedData, ScrapeLog)
│   │   ├── middleware/         # Auth, Error handling, Logging, Rate limiting
│   │   ├── routes/             # API route definitions
│   │   ├── utils/              # Logger, Scheduler, Scraper implementation
│   │   ├── types/              # Custom TypeScript types/interfaces
│   │   ├── migrations/         # Database migration scripts
│   │   ├── seed/               # Database seed scripts
│   │   ├── app.ts              # Express application setup
│   │   ├── server.ts           # Entry point for the backend server
│   ├── tests/                  # Unit and integration tests
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── ormconfig.ts            # TypeORM configuration
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios instance and API calls
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks (e.g., useAuth)
│   │   ├── pages/              # Top-level page components (Login, Dashboard, JobDetails)
│   │   ├── context/            # React Contexts (AuthContext)
│   │   ├── services/           # Frontend-specific services (e.g., auth storage)
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main App component and routing
│   │   ├── index.tsx           # Entry point for React app
│   ├── tests/                  # Frontend unit tests
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js
│
├── docker-compose.yml          # Orchestrates backend, frontend, postgres, redis
├── .github/workflows/          # CI/CD pipeline configuration example
├── README.md                   # Comprehensive project README
├── ARCHITECTURE.md             # Architecture overview
├── API_DOCUMENTATION.md        # API endpoint details
├── DEPLOYMENT.md               # Deployment guide