etms-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── etms/
│   │   │           └── backend/
│   │   │               ├── EtmsBackendApplication.java
│   │   │               ├── config/
│   │   │               │   ├── ApplicationConfig.java
│   │   │               │   ├── CacheConfig.java
│   │   │               │   ├── CorsConfig.java
│   │   │               │   ├── RateLimitFilter.java
│   │   │               │   └── WebSecurityConfig.java
│   │   │               ├── controller/
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── ProjectController.java
│   │   │               │   ├── TaskController.java
│   │   │               │   └── UserController.java
│   │   │               ├── dto/
│   │   │               │   ├── AuthRequest.java
│   │   │               │   ├── AuthResponse.java
│   │   │               │   ├── ProjectDTO.java
│   │   │               │   ├── RegisterRequest.java
│   │   │               │   ├── TaskDTO.java
│   │   │               │   └── UserDTO.java
│   │   │               ├── exception/
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── ResourceNotFoundException.java
│   │   │               │   └── ValidationException.java
│   │   │               ├── model/
│   │   │               │   ├── Project.java
│   │   │               │   ├── Role.java
│   │   │               │   ├── Task.java
│   │   │               │   └── User.java
│   │   │               ├── repository/
│   │   │               │   ├── ProjectRepository.java
│   │   │               │   ├── TaskRepository.java
│   │   │               │   └── UserRepository.java
│   │   │               ├── security/
│   │   │               │   ├── JwtAuthenticationEntryPoint.java
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   ├── JwtTokenProvider.java
│   │   │               │   └── CustomUserDetailsService.java
│   │   │               └── service/
│   │   │                   ├── AuthService.java
│   │   │                   ├── ProjectService.java
│   │   │                   ├── TaskService.java
│   │   │                   └── UserService.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── logback-spring.xml
│   │       └── db/
│   │           └── migration/
│   │               ├── V1__initial_schema.sql
│   │               └── V2__add_seed_data.sql
│   └── test/
│       └── java/
│           └── com/
│               └── etms/
│                   └── backend/
│                       ├── controller/
│                       │   ├── ProjectControllerTest.java
│                       │   └── TaskControllerTest.java
│                       ├── repository/
│                       │   └── UserRepositoryTest.java
│                       └── service/
│                           └── TaskServiceTest.java
├── pom.xml
└── Dockerfile