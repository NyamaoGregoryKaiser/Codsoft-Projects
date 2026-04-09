data-viz-system/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── data_sources.py
│   │   │   │   ├── datasets.py
│   │   │   │   ├── visualizations.py
│   │   │   │   ├── dashboards.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── exceptions.py
│   │   │   ├── middleware.py
│   │   │   ├── dependencies.py
│   │   │   └── logging_config.py
│   │   ├── crud/
│   │   │   ├── base.py
│   │   │   ├── users.py
│   │   │   ├── data_sources.py
│   │   │   ├── datasets.py
│   │   │   ├── visualizations.py
│   │   │   ├── dashboards.py
│   │   │   └── __init__.py
│   │   ├── db/
│   │   │   ├── base.py  # Base for all SQLAlchemy models
│   │   │   ├── session.py
│   │   │   ├── models.py
│   │   │   └── init_db.py
│   │   ├── schemas/
│   │   │   ├── token.py
│   │   │   ├── user.py
│   │   │   ├── data_source.py
│   │   │   ├── dataset.py
│   │   │   ├── visualization.py
│   │   │   ├── dashboard.py
│   │   │   └── msg.py
│   │   ├── services/
│   │   │   ├── data_connector.py # Handles connections to external DBs
│   │   │   └── query_executor.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_security.py
│   │   │   └── test_data_connector.py
│   │   ├── integration/
│   │   │   └── test_api.py
│   │   └── api/
│   │       └── test_auth_api.py
│   ├── scripts/
│   │   └── seed_db.py
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   └── pytest.ini
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── components/
│   │   │       ├── Login.tsx
│   │   │       └── Register.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── PrivateRoute.tsx
│   │   ├── data-sources/
│   │   │   ├── DataSourceList.tsx
│   │   │   └── DataSourceForm.tsx
│   │   ├── datasets/
│   │   │   ├── DatasetList.tsx
│   │   │   └── DatasetForm.tsx
│   │   ├── visualizations/
│   │   │   ├── VisualizationCreator.tsx
│   │   │   ├── ChartRenderer.tsx
│   │   │   └── VisualizationList.tsx
│   │   ├── dashboards/
│   │   │   ├── DashboardViewer.tsx
│   │   │   ├── DashboardBuilder.tsx
│   │   │   └── DashboardList.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── DataSourcesPage.tsx
│   │   │   ├── DatasetsPage.tsx
│   │   │   ├── VisualizationsPage.tsx
│   │   │   ├── DashboardsPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useApi.ts
│   │   ├── utils/
│   │   │   └── validation.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── reportWebVitals.ts
│   ├── tests/
│   │   ├── auth/
│   │   │   └── Login.test.tsx
│   │   ├── components/
│   │   │   └── Navbar.test.tsx
│   │   └── pages/
│   │       └── HomePage.test.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.development
│   └── .env.production
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── API.md