chat-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.js             # Environment variables loader
│   │   │   ├── database.js          # PostgreSQL DB connection
│   │   │   └── redis.js             # Redis client setup
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── roomController.js
│   │   │   └── messageController.js
│   │   ├── middleware/              # Express middleware
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   ├── errorMiddleware.js   # Custom error handler
│   │   │   └── rateLimitMiddleware.js # API rate limiting
│   │   ├── models/                  # Sequelize model definitions
│   │   │   ├── index.js             # Sequelize initialization, associations
│   │   │   ├── userModel.js
│   │   │   ├── roomModel.js
│   │   │   └── messageModel.js
│   │   ├── services/                # Business logic
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── roomService.js
│   │   │   └── messageService.js
│   │   ├── routes/                  # API endpoints
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── roomRoutes.js
│   │   │   └── messageRoutes.js
│   │   ├── utils/                   # Utility functions
│   │   │   ├── logger.js            # Winston logger setup
│   │   │   └── jwt.js               # JWT token generation/verification
│   │   ├── socket.js                # Socket.IO event handlers
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # Main server entry point
│   ├── tests/                       # Backend tests
│   │   ├── unit/
│   │   │   ├── models.test.js
│   │   │   └── services.test.js
│   │   ├── integration/
│   │   │   └── api.test.js
│   ├── migrations/                  # Database migration files (sequelize-cli)
│   ├── seeders/                     # Database seed files (sequelize-cli)
│   ├── .env.example                 # Example environment variables
│   ├── .gitignore
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── api/                     # Axios API client setup
│   │   │   ├── axiosConfig.js
│   │   │   ├── authApi.js
│   │   │   └── chatApi.js
│   │   ├── components/              # Reusable UI components
│   │   │   ├── AuthForm.js
│   │   │   ├── ChatWindow.js
│   │   │   ├── MessageInput.js
│   │   │   ├── RoomList.js
│   │   │   └── UserList.js
│   │   ├── contexts/                # React Context for global state
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── useChat.js
│   │   ├── pages/                   # Main views/pages
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   └── ChatPage.js
│   │   ├── utils/                   # Frontend utilities
│   │   │   └── localStorage.js
│   │   ├── App.js                   # Main React component
│   │   ├── index.js                 # Entry point for React app
│   │   └── styles/                  # CSS styles
│   │       ├── index.css
│   │       └── variables.css
│   ├── tests/                       # Frontend tests
│   │   ├── components/
│   │   │   └── ChatWindow.test.js
│   │   ├── pages/
│   │   │   └── LoginPage.test.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml               # Docker Compose for multi-service setup
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # GitHub Actions CI/CD pipeline
├── ARCHITECTURE.md                  # High-level architecture documentation
└── README.md                        # Project README (this file)