vizcraft/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── extensions.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── datasource.py
│   │   │   ├── dashboard.py
│   │   │   ├── visualization.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── datasource.py
│   │   │   │   ├── visualization.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── datasource.py
│   │   │   │   ├── visualization.py
│   │   │   ├── parsers.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── data_connector.py # Handles data source connections
│   │   │   ├── query_executor.py # Executes queries against data sources
│   │   │   ├── visualization_renderer.py # Generates chart configs
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── decorators.py # e.g., permission checks
│   │   │   ├── helpers.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── error_handlers.py
│   │   │   ├── rate_limiter.py
│   │   │   ├── caching.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── unit/
│   │   │   │   ├── test_models.py
│   │   │   │   ├── test_utils.py
│   │   │   ├── integration/
│   │   │   │   ├── test_auth_api.py
│   │   │   │   ├── test_dashboard_api.py
│   │   │   ├── performance/
│   │   │   │   ├── locustfile.py
│   │   ├── templates/ # For simple error pages or email templates
│   │   ├── static/ # For potential static assets served by Flask
│   │   ├── logging_setup.py
│   │   ├── wsgi.py
│   ├── migrations/
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── ... # Migration files
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── run.py # For local development
│   └── setup.cfg # for pytest coverage
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/ # Images, icons
│   │   ├── components/
│   │   │   ├── common/ # Header, Footer, Sidebar, Button
│   │   │   ├── auth/ # Login, Register forms
│   │   │   ├── dashboards/ # Dashboard card, editor
│   │   │   ├── visualizations/ # Chart wrapper, config editor
│   │   │   ├── datasources/ # Connection form
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardsPage.tsx
│   │   │   ├── DashboardEditorPage.tsx
│   │   │   ├── DataSourcesPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts # Axios instance, API calls
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── datasource.ts
│   │   │   ├── visualization.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDebounce.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validation.ts
│   │   ├── styles/
│   │   │   ├── index.css # Tailwind CSS directives
│   │   │   ├── theme.ts # Custom theme config
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── react-app-env.d.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_components.test.tsx
│   │   │   ├── test_hooks.test.ts
│   │   ├── e2e/
│   │   │   ├── cypress/
│   │   │   │   ├── integration/
│   │   │   │   │   ├── auth.spec.ts
│   │   │   │   │   ├── dashboards.spec.ts
│   │   │   │   ├── support/
│   │   │   │   ├── plugins/
│   │   │   │   └── cypress.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.development
│   ├── .env.production
│   └── Dockerfile
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── docs/
│   ├── README.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml
└── LICENSE