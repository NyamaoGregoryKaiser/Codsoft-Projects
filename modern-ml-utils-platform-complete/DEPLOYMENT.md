```markdown
# ML Utilities System - Deployment Guide

This document outlines the steps and considerations for deploying the ML Utilities System to a production environment.

## Table of Contents

- [Deployment Strategy](#deployment-strategy)
- [Prerequisites](#prerequisites)
- [Local Deployment with Docker Compose](#local-deployment-with-docker-compose)
- [Cloud Deployment Considerations](#cloud-deployment-considerations)
  - [1. Infrastructure Provisioning](#1-infrastructure-provisioning)
  - [2. Database Setup](#2-database-setup)
  - [3. Application Configuration](#3-application-configuration)
  - [4. Docker Image Management](#4-docker-image-management)
  - [5. Container Orchestration](#5-container-orchestration)
  - [6. Networking and Load Balancing](#6-networking-and-load-balancing)
  - [7. Monitoring and Logging](#7-monitoring-and-logging)
  - [8. CI/CD Integration](#8-ci-cd-integration)
  - [9. Scalability](#9-scalability)
  - [10. Security Hardening](#10-security-hardening)
- [Performance Testing](#performance-testing)
- [Rollback Strategy](#rollback-strategy)

## Deployment Strategy

The recommended deployment strategy for the ML Utilities System is containerization using Docker, orchestrated by a platform like Kubernetes (EKS, AKS, GKE) or AWS ECS/Fargate. This provides scalability, resilience, and consistent environments.

## Prerequisites

Before deployment, ensure you have:

*   **Source Code:** Cloned from the repository.
*   **Java 17 & Maven:** For building the JAR locally or in CI.
*   **Docker & Docker Compose:** For local development and building images.
*   **Cloud Provider Account:** (e.g., AWS, Azure, GCP) if deploying to the cloud.
*   **CI/CD System:** (e.g., GitHub Actions, Jenkins, GitLab CI) configured.
*   **Secrets Management:** A secure way to manage environment variables (e.g., AWS Secrets Manager, Kubernetes Secrets, HashiCorp Vault).

## Local Deployment with Docker Compose

This is ideal for local development and testing, demonstrating how the services interact.

1.  **Build the application JAR:**
    ```bash
    mvn clean install -DskipTests
    ```
2.  **Update `JWT_SECRET` in `docker-compose.yml`:**
    Replace the placeholder with a strong, base64-encoded secret key.
    ```bash
    # Example to generate a secret:
    openssl rand -base64 32
    ```
3.  **Start the services:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build the `ml-utilities-system` Docker image.
    *   Pull and start a PostgreSQL container.
    *   Start the Spring Boot application.
    *   Run Flyway migrations on the PostgreSQL database.
4.  **Verify:**
    *   Application should be accessible at `http://localhost:8080`.
    *   Swagger UI at `http://localhost:8080/swagger-ui.html`.
    *   Actuator health endpoint at `http://localhost:8080/actuator/health`.

## Cloud Deployment Considerations

For production, manual Docker Compose is not sufficient. Here's a checklist of considerations for cloud deployment:

### 1. Infrastructure Provisioning

*   **Cloud Provider:** Choose your preferred cloud (AWS, Azure, GCP).
*   **Compute:**
    *   **Kubernetes:** Managed Kubernetes Service (EKS, AKS, GKE) is highly recommended for container orchestration.
    *   **ECS/Fargate (AWS):** Simpler container orchestration if Kubernetes is too complex.
    *   **Virtual Machines (VMs):** If container orchestration is not desired, provision VMs and install Docker.
*   **Network:** Set up Virtual Private Clouds (VPCs), subnets, security groups, and routing tables.
*   **Managed Services:** Leverage managed services where possible to reduce operational overhead (e.g., Managed PostgreSQL, Managed Kubernetes).

### 2. Database Setup

*   **Managed PostgreSQL:** Use a managed service like AWS RDS for PostgreSQL, Azure Database for PostgreSQL, or Google Cloud SQL. This handles backups, patching, and high availability.
*   **Database Credentials:** Store securely in a secrets manager (e.g., AWS Secrets Manager, Azure Key Vault, Google Secret Manager, Kubernetes Secrets).
*   **Flyway:** Flyway migrations will run automatically on application startup. Ensure the database user has sufficient permissions for schema modifications during initial deployment and upgrades. For production, `spring.jpa.hibernate.ddl-auto` should be `validate`.

### 3. Application Configuration

*   **Environment Variables:** All sensitive configurations (database credentials, JWT secret, external API keys) should be passed via environment variables, not hardcoded in the Docker image.
    *   `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
    *   `JWT_SECRET` (Use a very strong, long, random key. Regenerate for production.)
*   **Spring Profiles:** Use `spring.profiles.active=prod` to activate production-specific configurations (e.g., connection pool size, logging levels).
*   **Memory/CPU Limits:** Configure appropriate memory and CPU limits for your application containers based on performance testing results.

### 4. Docker Image Management

*   **Container Registry:** Use a private container registry (e.g., Docker Hub Private Repositories, AWS ECR, Azure Container Registry, Google Container Registry) to store your Docker images.
*   **Image Tagging:** Implement a clear tagging strategy (e.g., `latest`, `commit-sha`, `version-number`).
*   **Security Scanning:** Integrate container image scanning (e.g., Trivy, Clair, commercial tools) into your CI/CD pipeline to identify vulnerabilities.

### 5. Container Orchestration (e.g., Kubernetes)

*   **Deployment Manifests:** Create Kubernetes Deployment, Service, ConfigMap, and Secret manifests (`.yaml` files).
*   **Replica Sets:** Configure replica sets to ensure multiple instances of your application are running for high availability.
*   **Readiness/Liveness Probes:** Configure health checks (`/actuator/health`) to enable Kubernetes to manage application lifecycle (e.g., restart unhealthy instances, prevent traffic to unready pods).
*   **Resource Limits:** Define `requests` and `limits` for CPU and memory for your pods.
*   **Horizontal Pod Autoscaler (HPA):** Configure HPA to automatically scale the number of application pods based on CPU utilization or custom metrics (e.g., prediction requests per second).

### 6. Networking and Load Balancing

*   **Load Balancer:** Place the application behind a load balancer (e.g., AWS ALB/NLB, Azure Application Gateway, Kubernetes Ingress Controller) for traffic distribution, SSL/TLS termination, and potentially WAF integration.
*   **HTTPS:** Enforce HTTPS for all external communication. Configure SSL certificates.
*   **Firewall Rules / Security Groups:** Restrict inbound/outbound traffic to only necessary ports and IPs.

### 7. Monitoring and Logging

*   **Metrics:**
    *   Expose Prometheus metrics via `/actuator/prometheus`.
    *   Integrate with Prometheus for scraping and Grafana for dashboards.
    *   Monitor JVM metrics, HTTP request metrics, custom application metrics (e.g., number of predictions, cache hit rates).
*   **Logging:**
    *   Centralize logs from all application instances (e.g., using an ELK stack - Elasticsearch, Logstash, Kibana, or cloud-native solutions like AWS CloudWatch Logs, Azure Monitor, Google Cloud Logging).
    *   Ensure proper log levels are set for production (`INFO` or `WARN` for general logging, `ERROR` for critical issues).
*   **Alerting:** Set up alerts based on key metrics (e.g., high error rates, low throughput, high latency, resource utilization).

### 8. CI/CD Integration

*   **Automate Everything:** The provided `.github/workflows/main.yml` demonstrates a basic CI pipeline. Extend it for CD:
    *   **Build:** Automatically build the Docker image upon code merge to `main`.
    *   **Test:** Run all unit, integration, and potentially API tests.
    *   **Scan:** Perform security scans on code (SonarQube) and Docker images (Trivy).
    *   **Deploy:** Automatically deploy the new Docker image to a staging environment. After successful testing in staging, promote to production.
*   **Environment-Specific Deployments:** Use separate CI/CD stages and configurations for `dev`, `staging`, and `prod` environments.

### 9. Scalability

*   **Horizontal Scaling:** Design the application to be stateless, allowing multiple instances to run concurrently.
*   **Database Scaling:** Implement read replicas for read-heavy workloads. Consider sharding or other advanced database scaling techniques if necessary.
*   **External ML Inference:** If using an external ML inference engine, ensure it is also scalable and highly available.
*   **Caching:** For global caching needs, use a distributed cache (e.g., Redis) instead of or in addition to Caffeine.

### 10. Security Hardening

*   **Secrets Management:** Never hardcode secrets. Use a dedicated secrets management service.
*   **Least Privilege:** Configure IAM roles/service accounts for containers and CI/CD agents with only the necessary permissions.
*   **Network Segmentation:** Use private subnets for application and database tiers. Restrict database access to only the application instances.
*   **API Security:** Regular security audits, penetration testing.
*   **Dependency Scanning:** Use tools like OWASP Dependency-Check to identify known vulnerabilities in libraries.

## Performance Testing

Before deploying to production, comprehensive performance testing is crucial.

1.  **Define NFRs:** Establish clear Non-Functional Requirements (NFRs) for performance, e.g.:
    *   **Throughput:** 500 predictions per second.
    *   **Latency:** Average prediction response time < 100ms.
    *   **Error Rate:** < 0.1% for all API calls.
    *   **Resource Utilization:** CPU < 70%, Memory < 80%.
2.  **Tools:** Use dedicated load testing tools:
    *   **Apache JMeter:** Widely used, GUI-based.
    *   **Gatling:** Scala-based, code-driven, good for high-performance tests.
    *   **k6:** JavaScript-based, developer-friendly.
3.  **Scenarios:** Design tests for critical paths:
    *   User authentication (login).
    *   Registering a new model (low frequency, high load not expected).
    *   Uploading a model version (low frequency).
    *   **Making predictions (high frequency, peak load expected).**
    *   Data preprocessing.
4.  **Monitoring during tests:** Observe application and infrastructure metrics to identify bottlenecks.
5.  **Iteration:** Iterate on performance tests, optimize identified bottlenecks, and re-test until NFRs are met.

## Rollback Strategy

Always have a robust rollback plan:

*   **Versioned Deployments:** Use versioned Docker images.
*   **Orchestration Rollback:** Kubernetes Deployments natively support rollback to previous versions.
*   **Database Migrations:** Flyway provides mechanisms for rollback, but generally, database schema changes should be forward-compatible. If a migration is problematic, restoring a database snapshot might be necessary.
*   **Monitoring:** Use monitoring systems to quickly detect issues post-deployment that might necessitate a rollback.

By following this comprehensive guide, you can ensure a smooth, secure, and scalable deployment of the ML Utilities System.
```