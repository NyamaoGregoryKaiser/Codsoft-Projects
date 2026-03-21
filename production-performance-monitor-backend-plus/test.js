graph TD
    A[Client Browser] -->|HTTP/HTTPS| B(React Frontend)
    B -->|API Calls (JWT)| C(FastAPI Backend)
    D[External Monitored Application] -->|API Calls (API Key)| C

    C --> E(PostgreSQL Database)
    C --> F(Redis Cache/Rate Limiter)

    subgraph CI/CD
        G[GitHub Push] --> H(GitHub Actions)
        H --> I(Test, Build & Push Docker Images)
    end