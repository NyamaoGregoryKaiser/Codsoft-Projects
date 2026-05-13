payment_processor/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── merchants.py
│   │   │   │   ├── customers.py
│   │   │   │   ├── payment_methods.py
│   │   │   │   ├── transactions.py
│   │   │   │   └── webhooks.py
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   ├── exceptions.py
│   │   ├── middleware.py
│   │   └── logger.py
│   ├── crud/
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── merchant.py
│   │   ├── customer.py
│   │   ├── payment_method.py
│   │   └── transaction.py
│   ├── database/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── models.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── merchant.py
│   │   ├── customer.py
│   │   ├── payment_method.py
│   │   ├── transaction.py
│   │   ├── auth.py
│   │   └── common.py
│   ├── services/
│   │   ├── payment_gateway.py (Mocked External Service)
│   │   ├── transaction_service.py
│   │   ├── webhook_service.py
│   │   └── caching_service.py
│   ├── tasks/
│   │   ├── celery_app.py
│   │   └── payment_tasks.py
│   ├── main.py
│   └── __init__.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
│   ├── unit/
│   │   ├── test_security.py
│   │   └── test_schemas.py
│   ├── integration/
│   │   ├── test_crud.py
│   │   └── test_services.py
│   ├── api/
│   │   ├── test_auth_api.py
│   │   ├── test_merchants_api.py
│   │   ├── test_transactions_api.py
│   │   └── test_payment_flow.py
│   └── conftest.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── auth.js
│   │   │   └── payment.js
│   │   ├── components/
│   │   │   └── Header.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   └── PaymentPage.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
├── README.md
├── .github/workflows/
│   └── cicd.yml
├── seed_data.py
├── locustfile.py
└── logs/
    └── app.log