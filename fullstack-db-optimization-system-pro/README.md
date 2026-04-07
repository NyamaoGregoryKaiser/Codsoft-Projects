dboptiflow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── databases.py
│   │   │   │   ├── metrics.py
│   │   │   │   ├── suggestions.py
│   │   │   │   ├── tasks.py
│   │   │   │   └── users.py
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── exceptions.py
│   │   │   ├── logging_config.py
│   │   │   └── middleware.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   ├── models.py
│   │   │   ├── crud.py
│   │   │   └── migrations/ (Alembic generated)
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── database_service.py
│   │   │   ├── metric_service.py
│   │   │   ├── suggestion_service.py
│   │   │   ├── task_service.py
│   │   │   └── user_service.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── database.py
│   │   │   ├── metric.py
│   │   │   ├── suggestion.py
│   │   │   ├── task.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   ├── main.py
│   │   └── initial_data.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   └── test_services.py
│   │   ├── integration/
│   │   │   └── test_database_crud.py
│   │   └── api/
│   │       └── test_auth_api.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.ts
│   │   │   ├── databases.ts
│   │   │   ├── metrics.ts
│   │   │   ├── suggestions.ts
│   │   │   ├── tasks.ts
│   │   │   ├── users.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx
│   │   │   ├── ChartComponent.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Table.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Databases.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Metrics.tsx
│   │   │   ├── OptimizationSuggestions.tsx
│   │   │   ├── Tasks.tsx
│   │   │   └── Users.tsx
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── tailwind.config.js
│   └── Dockerfile
├── .env.example
├── docker-compose.yml
├── README.md
├── API.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── locustfile.py
├── .github/
│   └── workflows/
│       └── main.yml
└── .gitignore