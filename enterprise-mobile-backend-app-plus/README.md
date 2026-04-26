task-manager-backend/
├── .github/
│   └── workflows/
│       └── main.yml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── taskmanager/
│   │   │               ├── TaskManagerApplication.java
│   │   │               ├── config/
│   │   │               │   ├── CacheConfig.java
│   │   │               │   ├── OpenApiConfig.java
│   │   │               │   └── SecurityConfig.java
│   │   │               ├── controller/
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── CategoryController.java
│   │   │               │   ├── TaskController.java
│   │   │               │   └── UserController.java
│   │   │               ├── dto/
│   │   │               │   ├── auth/
│   │   │               │   │   ├── JwtAuthenticationResponse.java
│   │   │               │   │   ├── LoginRequest.java
│   │   │               │   │   └── RegisterRequest.java
│   │   │               │   ├── category/
│   │   │               │   │   ├── CategoryRequest.java
│   │   │               │   │   └── CategoryResponse.java
│   │   │               │   ├── task/
│   │   │               │   │   ├── TaskRequest.java
│   │   │               │   │   └── TaskResponse.java
│   │   │               │   └── user/
│   │   │               │   │   ├── UserResponse.java
│   │   │               │   │   └── UserUpdateRequest.java
│   │   │               ├── entity/
│   │   │               │   ├── Category.java
│   │   │               │   ├── Role.java
│   │   │               │   ├── Task.java
│   │   │               │   ├── TaskStatus.java
│   │   │               │   └── User.java
│   │   │               ├── exception/
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── ResourceNotFoundException.java
│   │   │               │   └── UserAlreadyExistsException.java
│   │   │               ├── filter/
│   │   │               │   └── JwtAuthenticationFilter.java
│   │   │               ├── interceptor/
│   │   │               │   ├── RateLimitInterceptor.java
│   │   │               │   └── WebConfig.java
│   │   │               ├── repository/
│   │   │               │   ├── CategoryRepository.java
│   │   │               │   ├── TaskRepository.java
│   │   │               │   └── UserRepository.java
│   │   │               ├── service/
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── CategoryService.java
│   │   │               │   ├── JwtService.java
│   │   │               │   ├── TaskService.java
│   │   │               │   └── UserService.java
│   │   │               └── util/
│   │   │                   └── JwtUtil.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── db/
│   │       │   └── migration/
│   │       │       ├── V1__initial_schema.sql
│   │       │       └── V2__seed_data.sql
│   │       └── logback-spring.xml
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── taskmanager/
│                       ├── controller/
│                       │   ├── AuthControllerIntegrationTest.java
│                       │   ├── CategoryControllerIntegrationTest.java
│                       │   └── TaskControllerIntegrationTest.java
│                       ├── repository/
│                       │   ├── CategoryRepositoryTest.java
│                       │   ├── TaskRepositoryTest.java
│                       │   └── UserRepositoryTest.java
│                       └── service/
│                           ├── AuthServiceTest.java
│                           ├── CategoryServiceTest.java
│                           ├── TaskServiceTest.java
│                           └── UserServiceTest.java
├── Dockerfile
├── docker-compose.yml
├── pom.xml
└── README.md