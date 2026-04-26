backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── items.py
│   │   │   │   ├── users.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   ├── exceptions.py
│   │   ├── handlers.py
│   │   ├── logging.py
│   │   ├── middleware.py
│   │   ├── rate_limiter.py
│   │   └── __init__.py
│   ├── crud/
│   │   ├── base.py
│   │   ├── item.py
│   │   ├── user.py
│   │   └── __init__.py
│   ├── db/
│   │   ├── base.py
│   │   ├── init_db.py
│   │   ├── session.py
│   │   ├── models/
│   │   │   ├── base.py
│   │   │   ├── item.py
│   │   │   ├── user.py
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── item.py
│   │   ├── msg.py
│   │   ├── token.py
│   │   ├── user.py
│   │   └── __init__.py
│   ├── main.py
│   └── __init__.py
├── alembic/
│   ├── versions/
│   └── env.py
├── scripts/
│   ├── run_migrations.py
│   ├── seed_data.py
│   └── start_backend.sh
├── tests/
│   ├── conftest.py
│   ├── api/
│   │   ├── test_auth_api.py
│   │   ├── test_items_api.py
│   │   └── test_users_api.py
│   ├── unit/
│   │   ├── test_crud_user.py
│   │   └── test_security.py
│   ├── performance/
│   │   └── test_locust.py
│   └── __init__.py
├── Dockerfile
├── requirements.txt
├── .env.example
├── README.md
└── uvicorn_log_config.json