ecommerce-system/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                # API service calls
│   │   ├── assets/             # Images, icons
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # Header, Footer, Navbar
│   │   │   ├── ProductCard.jsx
│   │   │   └── ...
│   │   ├── contexts/           # React Context for global state (Auth, Cart)
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── pages/              # Page-level components (Home, ProductDetail, Cart, Auth, Admin)
│   │   │   ├── Auth/
│   │   │   ├── Admin/
│   │   │   └── ...
│   │   ├── styles/             # Global CSS/Tailwind config
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main application component
│   │   └── index.js            # Entry point
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Node.js/Express Backend
│   ├── src/
│   │   ├── config/             # Environment, Database, Logger configuration
│   │   ├── controllers/        # Handle requests, call services
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   └── ...
│   │   ├── middleware/         # Auth, Error handling, Logging, Rate limiting
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   └── ...
│   │   ├── models/             # Prisma schema (conceptual for structure, actual in /prisma)
│   │   ├── routes/             # API routes definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   └── ...
│   │   ├── services/           # Business logic, interact with DB via Prisma client
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   └── ...
│   │   ├── utils/              # JWT, Hashing, Validators
│   │   │   ├── jwt.js
│   │   │   ├── validators.js
│   │   │   └── ...
│   │   ├── app.js              # Express app setup, middleware, routes
│   │   └── server.js           # Entry point, start server
│   ├── tests/                  # Unit and Integration tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── setup.js
│   ├── .env.example
│   ├── package.json
│   └── jest.config.js
├── prisma/                     # Database schema and migrations
│   ├── migrations/             # Auto-generated migration files
│   ├── schema.prisma           # Prisma schema definition
│   └── seed.js                 # Seed data script
├── .github/                    # CI/CD workflows
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml          # Docker Compose setup for dev/prod
├── Dockerfile                  # Backend Dockerfile
├── nginx.conf                  # Nginx configuration (for production)
├── README.md                   # Project documentation
├── docs/                       # Additional documentation
│   ├── api.md                  # API documentation (OpenAPI/Swagger)
│   ├── architecture.md
│   └── deployment.md
└── .gitignore