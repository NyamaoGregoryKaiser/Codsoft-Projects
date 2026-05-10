graph LR
    User(Web Browser / Mobile App) --> |Frontend (React/Vue/Angular)| Nginx(Nginx Reverse Proxy)
    Nginx --> |API Requests| CppBackend(C++ Payment Service)

    CppBackend --&gt; |Reads/Writes| Postgres(PostgreSQL Database)
    CppBackend --&gt; |Logs| Spdlog(Spdlog Logger)
    CppBackend --&gt; |Cache (Optional)| Redis(Redis Cache)

    subgraph Monitoring & Alerting
        CppBackend --&gt; Prometheus(Prometheus Exporter)
        Prometheus --> Grafana(Grafana Dashboard)
    end

    subgraph External Integrations (Mocked)
        CppBackend --&gt; |Payment Gateway A (Stripe/PayPal)| ExternalPGA(External Payment Gateway A)
        CppBackend --&gt; |Fraud Detection Service| ExternalFDS(External Fraud Detection Service)
    end

    subgraph CI/CD Pipeline
        Github(GitHub Actions) --> Build(Build & Test C++ App)
        Build --> DockerBuild(Build Docker Images)
        DockerBuild --> Deploy(Deploy to Staging/Production)
    end