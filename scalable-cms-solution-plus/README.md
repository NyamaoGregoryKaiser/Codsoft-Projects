cms-system/
├── backend/
│   ├── CMakeLists.txt
│   ├── src/
│   │   ├── main.cc
│   │   ├── common/
│   │   │   ├── Constants.h
│   │   │   └── Enums.h
│   │   ├── config/
│   │   │   ├── AppConfig.h
│   │   │   └── AppConfig.cc
│   │   ├── controllers/
│   │   │   ├── AuthController.h
│   │   │   ├── AuthController.cc
│   │   │   ├── CategoryController.h
│   │   │   ├── CategoryController.cc
│   │   │   ├── PostController.h
│   │   │   ├── PostController.cc
│   │   │   ├── UserController.h
│   │   │   └── UserController.cc
│   │   ├── database/
│   │   │   └── DbClientManager.h
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.h
│   │   │   └── AuthMiddleware.cc
│   │   ├── models/
│   │   │   ├── User.h
│   │   │   ├── Category.h
│   │   │   └── Post.h
│   │   ├── services/
│   │   │   ├── AuthService.h
│   │   │   ├── AuthService.cc
│   │   │   ├── CacheService.h
│   │   │   ├── CacheService.cc
│   │   │   ├── TokenService.h  (JWT handling)
│   │   │   └── TokenService.cc
│   │   └── utils/
│   │       ├── Logger.h
│   │       ├── Logger.cc
│   │       ├── PasswordHasher.h
│   │       └── PasswordHasher.cc
│   ├── tests/
│   │   ├── CMakeLists.txt
│   │   ├── unit/
│   │   │   ├── TestAuthService.cc
│   │   │   └── TestPasswordHasher.cc
│   │   ├── integration/
│   │   │   └── TestAPI.cc
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   └── 002_add_roles_and_admin_user.sql
│   ├── config/
│   │   ├── default.json
│   │   └── development.json
│   ├── .env.example
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── README.md
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── api/
│   │   │   ├── auth.js
│   │   │   └── posts.js
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── LoginForm.js
│   │   │   ├── PostList.js
│   │   │   └── PrivateRoute.js
│   │   └── pages/
│   │       ├── HomePage.js
│   │       └── DashboardPage.js
│   ├── package.json
│   └── README.md
├── docs/
│   ├── API.md
│   ├── Architecture.md
│   └── Deployment.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml
└── .gitignore