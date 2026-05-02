.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── posts.py
│   │   │   │   │   └── users.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── logging.py
│   │   │   └── __init__.py
│   │   ├── crud/
│   │   │   ├── base.py
│   │   │   ├── post.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   ├── db/
│   │   │   ├── base_class.py
│   │   │   ├── init_db.py
│   │   │   └── session.py
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   ├── post.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   ├── msg.py
│   │   │   ├── post.py
│   │   │   ├── token.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── email_service.py
│   │   │   ├── token_service.py
│   │   │   └── __init__.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/
│   │   ├── integration/
│   │   │   ├── test_api_auth.py
│   │   │   ├── test_api_posts.py
│   │   │   └── test_api_users.py
│   │   ├── unit/
│   │   │   ├── test_security.py
│   │   │   └── test_token_service.py
│   │   ├── conftest.py
│   │   └── __init__.py
│   ├── .env.example
│   ├── .gitignore
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── requirements.txt
│   └── start.sh
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.js
│   │   │   ├── posts.js
│   │   │   ├── users.js
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── AuthForm.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── NavBar.js
│   │   │   ├── PostCard.js
│   │   │   └── PrivateRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── DashboardPage.js
│   │   │   ├── ForgotPasswordPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── NotFoundPage.js
│   │   │   ├── PostCreatePage.js
│   │   │   ├── PostDetailPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ResetPasswordPage.js
│   │   │   └── VerifyEmailPage.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.development
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   ├── README.md
│   └── yarn.lock
├── .github/
│   ├── workflows/
│   │   └── ci.yml
├── docker-compose.yml
├── architecture.md
└── README.md