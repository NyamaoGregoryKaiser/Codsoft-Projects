📦 web-scraping-orchestrator
 ┣ 📂 .github
 ┃ ┗ 📂 workflows
 ┃ ┗ 📄 ci-cd.yml
 ┣ 📂 backend
 ┃ ┣ 📂 alembic
 ┃ ┃ ┣ 📂 versions
 ┃ ┃ ┃ ┗ 📄 __init__.py
 ┃ ┃ ┃ ┗ 📄 initial_setup.py
 ┃ ┃ ┗ 📄 env.py
 ┃ ┃ ┗ 📄 script.py.mako
 ┃ ┣ 📂 core
 ┃ ┃ ┣ 📄 config.py
 ┃ ┃ ┣ 📄 database.py
 ┃ ┃ ┣ 📄 dependencies.py
 ┃ ┃ ┗ 📄 logger.py
 ┃ ┣ 📂 middleware
 ┃ ┃ ┣ 📄 error_handler.py
 ┃ ┃ ┗ 📄 rate_limiter.py
 ┃ ┣ 📂 models
 ┃ ┃ ┗ 📄 __init__.py
 ┃ ┃ ┣ 📄 base.py
 ┃ ┃ ┣ 📄 proxy.py
 ┃ ┃ ┣ 📄 scraper.py
 ┃ ┃ ┣ 📄 task.py
 ┃ ┃ ┣ 📄 user.py
 ┃ ┃ ┗ 📄 user_agent.py
 ┃ ┣ 📂 routers
 ┃ ┃ ┣ 📄 __init__.py
 ┃ ┃ ┣ 📄 auth.py
 ┃ ┃ ┣ 📄 proxies.py
 ┃ ┃ ┣ 📄 scrapers.py
 ┃ ┃ ┣ 📄 tasks.py
 ┃ ┃ ┣ 📄 users.py
 ┃ ┃ ┗ 📄 user_agents.py
 ┃ ┣ 📂 schemas
 ┃ ┃ ┣ 📄 __init__.py
 ┃ ┃ ┣ 📄 auth.py
 ┃ ┃ ┣ 📄 common.py
 ┃ ┃ ┣ 📄 proxy.py
 ┃ ┃ ┣ 📄 scraper.py
 ┃ ┃ ┣ 📄 task.py
 ┃ ┃ ┣ 📄 user.py
 ┃ ┃ ┗ 📄 user_agent.py
 ┃ ┣ 📂 services
 ┃ ┃ ┣ 📄 __init__.py
 ┃ ┃ ┣ 📄 crud.py
 ┃ ┃ ┣ 📄 scheduler.py
 ┃ ┃ ┣ 📄 scraper_engine.py
 ┃ ┃ ┗ 📄 security.py
 ┃ ┣ 📂 tests
 ┃ ┃ ┣ 📄 __init__.py
 ┃ ┃ ┣ 📄 conftest.py
 ┃ ┃ ┣ 📄 test_api_auth.py
 ┃ ┃ ┣ 📄 test_api_proxies.py
 ┃ ┃ ┣ 📄 test_api_scrapers.py
 ┃ ┃ ┣ 📄 test_api_tasks.py
 ┃ ┃ ┣ 📄 test_api_users.py
 ┃ ┃ ┣ 📄 test_api_user_agents.py
 ┃ ┃ ┣ 📄 test_crud.py
 ┃ ┃ ┣ 📄 test_scraper_engine.py
 ┃ ┃ ┗ 📄 test_security.py
 ┃ ┣ 📄 .env.example
 ┃ ┣ 📄 alembic.ini
 ┃ ┣ 📄 Dockerfile
 ┃ ┣ 📄 main.py
 ┃ ┣ 📄 performance_test.py
 ┃ ┣ 📄 requirements.txt
 ┃ ┗ 📄 seed_data.py
 ┣ 📂 frontend
 ┃ ┣ 📂 public
 ┃ ┃ ┣ 📄 favicon.ico
 ┃ ┃ ┣ 📄 index.html
 ┃ ┃ ┗ 📄 manifest.json
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 api
 ┃ ┃ ┃ ┗ 📄 index.js
 ┃ ┃ ┣ 📂 components
 ┃ ┃ ┃ ┣ 📄 Alert.jsx
 ┃ ┃ ┃ ┣ 📄 ConfirmModal.jsx
 ┃ ┃ ┃ ┣ 📄 Footer.jsx
 ┃ ┃ ┃ ┣ 📄 Header.jsx
 ┃ ┃ ┃ ┣ 📄 LoadingSpinner.jsx
 ┃ ┃ ┃ ┣ 📄 PrivateRoute.jsx
 ┃ ┃ ┃ ┣ 📄 ScraperForm.jsx
 ┃ ┃ ┃ ┣ 📄 ScraperResultViewer.jsx
 ┃ ┃ ┃ ┣ 📄 Table.jsx
 ┃ ┃ ┃ ┗ 📄 TextInput.jsx
 ┃ ┃ ┣ 📂 context
 ┃ ┃ ┃ ┗ 📄 AuthContext.js
 ┃ ┃ ┣ 📂 hooks
 ┃ ┃ ┃ ┗ 📄 useAuth.js
 ┃ ┃ ┣ 📂 pages
 ┃ ┃ ┃ ┣ 📄 Dashboard.jsx
 ┃ ┃ ┃ ┣ 📄 Login.jsx
 ┃ ┃ ┃ ┣ 📄 NotFound.jsx
 ┃ ┃ ┃ ┣ 📄 Proxies.jsx
 ┃ ┃ ┃ ┣ 📄 Register.jsx
 ┃ ┃ ┃ ┣ 📄 Scrapers.jsx
 ┃ ┃ ┃ ┣ 📄 Tasks.jsx
 ┃ ┃ ┃ ┣ 📄 UserAgents.jsx
 ┃ ┃ ┃ ┗ 📄 Users.jsx
 ┃ ┃ ┣ 📂 tests
 ┃ ┃ ┃ ┣ 📄 App.test.js
 ┃ ┃ ┃ ┣ 📄 AuthContext.test.js
 ┃ ┃ ┃ ┣ 📄 Header.test.js
 ┃ ┃ ┃ ┗ 📄 PrivateRoute.test.js
 ┃ ┃ ┣ 📂 utils
 ┃ ┃ ┃ ┗ 📄 constants.js
 ┃ ┃ ┣ 📄 App.css
 ┃ ┃ ┣ 📄 App.js
 ┃ ┃ ┣ 📄 index.css
 ┃ ┃ ┣ 📄 index.js
 ┃ ┃ ┣ 📄 reportWebVitals.js
 ┃ ┃ ┗ 📄 setupTests.js
 ┃ ┣ 📄 .env.example
 ┃ ┣ 📄 Dockerfile
 ┃ ┣ 📄 package-lock.json
 ┃ ┣ 📄 package.json
 ┃ ┗ 📄 tailwind.config.js
 ┣ 📄 .dockerignore
 ┣ 📄 .env.example
 ┣ 📄 ARCHITECTURE.md
 ┣ 📄 docker-compose.yml
 ┣ 📄 DEPLOYMENT.md
 ┣ 📄 README.md
 ┗ 📄 CODE_OF_CONDUCT.md