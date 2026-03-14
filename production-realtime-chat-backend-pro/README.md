.
├── .github/                       # CI/CD Workflows
│   └── workflows/
│       └── main.yml               # GitHub Actions CI/CD pipeline
├── client/                        # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/                   # API utilities (axios, socket)
│   │   │   ├── api.js             # Axios instance for REST calls
│   │   │   └── socket.js          # Socket.IO client instance
│   │   ├── assets/                # Styling and static assets
│   │   │   └── App.css            # Global CSS for basic styling
│   │   ├── components/            # Reusable React components
│   │   │   ├── MessageInput.js
│   │   │   ├── MessageItem.js
│   │   │   ├── MessageList.js
│   │   │   ├── Navbar.js
│   │   │   ├── RoomList.js
│   │   │   └── UserList.js
│   │   ├── contexts/              # React Context API for global state
│   │   │   ├── AuthContext.js     # User authentication state
│   │   │   ├── ChatContext.js     # Chat-specific state (messages, rooms)
│   │   │   └── SocketContext.js   # Socket.IO connection state
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── useChat.js
│   │   ├── pages/                 # Main application pages
│   │   │   ├── ChatPage.js
│   │   │   └── LoginPage.js
│   │   ├── services/              # Frontend business logic/API wrappers
│   │   │   └── authService.js
│   │   ├── utils/                 # Utility functions
│   │   │   └── helpers.js
│   │   ├── tests/                 # Frontend tests
│   │   │   ├── AuthContext.test.js
│   │   │   ├── ChatContext.test.js
│   │   │   └── LoginPage.test.js
│   │   ├── App.js                 # Main application component
│   │   └── index.js               # Entry point for React app
│   ├── .env                       # Environment variables for client
│   └── package.json               # Frontend dependencies and scripts
├── server/                        # Node.js Backend
│   ├── config/                    # Configuration files
│   │   ├── db.js                  # MongoDB connection
│   │   ├── redis.js               # Redis client connection
│   │   └── winston.js             # Winston logger configuration
│   ├── controllers/               # Request handlers for API routes
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   ├── roomController.js
│   │   └── userController.js
│   ├── middleware/                # Express middleware
│   │   ├── auth.js                # JWT authentication middleware
│   │   ├── errorHandler.js        # Global error handling
│   │   └── rateLimiter.js         # API rate limiting
│   ├── models/                    # Mongoose schemas
│   │   ├── Message.js
│   │   ├── Room.js
│   │   └── User.js
│   ├── services/                  # Business logic layer
│   │   ├── authService.js
│   │   ├── cacheService.js        # Redis caching operations
│   │   ├── messageService.js
│   │   ├── roomService.js
│   │   └── userService.js
│   ├── routes/                    # API route definitions
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── roomRoutes.js
│   │   └── userRoutes.js
│   ├── utils/                     # Utility functions
│   │   └── jwt.js                 # JWT token generation/verification
│   ├── websocket/                 # Socket.IO handlers
│   │   └── socketHandler.js
│   ├── tests/                     # Backend tests
│   │   ├── integration/           # Integration tests for API routes
│   │   │   ├── auth.integration.test.js
│   │   │   ├── message.integration.test.js
│   │   │   └── room.integration.test.js
│   │   └── unit/                  # Unit tests for services/models
│   │       ├── authService.unit.test.js
│   │       ├── cacheService.unit.test.js
│   │       └── userService.unit.test.js
│   ├── .env                       # Environment variables for server
│   ├── app.js                     # Express app setup and middleware
│   ├── server.js                  # Main entry point (starts Express & Socket.IO)
│   ├── package.json               # Backend dependencies and scripts
│   └── seed.js                    # Database seeding script
├── .dockerignore                  # Files to ignore in Docker builds
├── docker-compose.yml             # Docker Compose for local development
├── Dockerfile.client              # Dockerfile for React frontend
├── Dockerfile.server              # Dockerfile for Node.js backend
└── README.md                      # Project documentation (this file)