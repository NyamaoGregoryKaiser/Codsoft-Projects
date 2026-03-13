.
├── backend
│   ├── src
│   │   ├── main
│   │   │   ├── java
│   │   │   │   └── com
│   │   │   │       └── dboptimizationsystem
│   │   │   │           ├── DbOptimizationSystemApplication.java
│   │   │   │           ├── auth          (Authentication & Authorization)
│   │   │   │           ├── config        (Spring configurations)
│   │   │   │           ├── dbinstance    (Manage monitored database instances)
│   │   │   │           ├── querylog      (Manage simulated query logs)
│   │   │   │           ├── recommendation (Index & other recommendations)
│   │   │   │           ├── schemaissue   (Detected schema problems)
│   │   │   │           ├── optimizationtask (Track optimization actions)
│   │   │   │           └── util          (Global utilities, error handling)
│   │   │   └── resources
│   │   │       ├── application.yml
│   │   │       └── db/migration  (Flyway scripts)
│   │   └── test                  (Backend tests)
│   ├── pom.xml
│   └── Dockerfile
├── frontend
│   ├── public
│   ├── src
│   │   ├── api           (Frontend API client)
│   │   ├── auth          (Login/Register components/pages)
│   │   ├── components    (Reusable UI components)
│   │   ├── hooks         (Custom React hooks)
│   │   ├── layout        (Application layout)
│   │   ├── pages         (Main application pages)
│   │   ├── types         (TypeScript interfaces)
│   │   ├── App.tsx       (Main application component)
│   │   ├── index.css
│   │   └── main.tsx      (Entry point)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── Jenkinsfile           (CI/CD Pipeline - placeholder)
├── README.md             (Comprehensive documentation)
└── .env.example          (Environment variables example)