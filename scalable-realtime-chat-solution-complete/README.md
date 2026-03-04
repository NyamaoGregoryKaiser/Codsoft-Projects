realtime-chat-app/backend/
├── src/
│   ├── config/              # Environment variables, constants
│   │   ├── index.ts
│   │   └── logger.ts
│   │   └── prisma.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── models/              # Prisma schema definition
│   ├── services/            # Business logic (interacts with Prisma)
│   │   ├── authService.ts
│   │   ├── channelService.ts
│   │   ├── messageService.ts
│   │   └── userService.ts
│   ├── controllers/         # Handles requests, uses services
│   │   ├── authController.ts
│   │   ├── channelController.ts
│   │   ├── messageController.ts
│   │   └── userController.ts
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── channelRoutes.ts
│   │   ├── messageRoutes.ts
│   │   └── userRoutes.ts
│   ├── sockets/             # Socket.IO event handlers
│   │   └── chatSocket.ts
│   ├── utils/               # Utility functions
│   │   └── jwt.ts
│   │   └── password.ts
│   ├── app.ts               # Express app setup, middleware, routes
│   └── server.ts            # Entry point, starts HTTP and Socket.IO servers
├── prisma/                  # Prisma database schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md