# CI/CD Pipeline Configuration for ProjectPulse

This document outlines a conceptual CI/CD (Continuous Integration/Continuous Delivery) pipeline for the ProjectPulse application. The principles described here can be adapted to various CI/CD platforms such as Jenkins, GitHub Actions, GitLab CI, Azure DevOps, etc.

## 1. Goals of the CI/CD Pipeline

*   **Automation:** Automate the build, test, and deployment processes.
*   **Quality Assurance:** Ensure code quality and correctness through automated testing at various levels.
*   **Rapid Feedback:** Provide quick feedback to developers on code changes.
*   **Reliable Deployments:** Enable frequent, low-risk deployments to production environments.
*   **Traceability:** Maintain a clear history of changes and deployments.

## 2. Core Stages of the Pipeline

A typical pipeline for ProjectPulse would consist of the following stages:

### Stage 1: Build & Static Analysis (Backend & Frontend)

**Trigger:**
*   `Push` to `main` branch.
*   `Pull Request` to `main` branch.

**Steps:**

1.  **Checkout Code:** Clone the repository.
2.  **Backend Build:**
    *   Navigate to `backend/`.
    *   `./mvnw clean install -DskipTests` (builds JAR, skips tests at this stage to speed up feedback, tests run in next stage).
    *   Run Static Code Analysis (e.g., SonarQube integration, Checkstyle, FindBugs). Fail if critical issues are found.
3.  **Frontend Build:**
    *   Navigate to `frontend/`.
    *   `npm install`
    *   `npm run tailwind:build` (compile Tailwind CSS)
    *   `npm run build` (create production build).
    *   Run Linting (ESLint) and Static Code Analysis (e.g., Lighthouse CI, Webpack Bundle Analyzer). Fail if critical issues are found.

**Artifacts:** Backend JAR, Frontend build artifacts (static files).

### Stage 2: Unit & Integration Testing

**Trigger:** Successful completion of "Build & Static Analysis" stage.

**Steps:**

1.  **Backend Tests:**
    *   Navigate to `backend/`.
    *   `./mvnw test` (runs all unit and integration tests using `application-test.yml` and Testcontainers).
    *   `./mvnw jacoco:report` (generates code coverage report).
    *   **Coverage Check:** Fail the build if code coverage (e.g., JaCoCo, aiming for 80% line, 60% branch) falls below predefined thresholds.
2.  **Frontend Tests:**
    *   Navigate to `frontend/`.
    *   `npm test -- --coverage` (runs Jest unit tests and generates coverage report).
    *   **Coverage Check:** Fail the build if frontend test coverage falls below thresholds.

**Reporting:** Publish test reports (JUnit XML, JaCoCo, Jest coverage) to the CI/CD platform.

### Stage 3: Docker Image Build & Push

**Trigger:** Successful completion of "Unit & Integration Testing" stage.

**Steps:**

1.  **Build Backend Docker Image:**
    *   `docker build -t your-registry/projectpulse-backend:$(GIT_COMMIT) -t your-registry/projectpulse-backend:latest ./backend`
2.  **Build Frontend Docker Image:**
    *   `docker build -t your-registry/projectpulse-frontend:$(GIT_COMMIT) -t your-registry/projectpulse-frontend:latest ./frontend`
3.  **Login to Container Registry:**
    *   `docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD your-registry`
4.  **Push Docker Images:**
    *   `docker push your-registry/projectpulse-backend:$(GIT_COMMIT)`
    *   `docker push your-registry/projectpulse-backend:latest`
    *   `docker push your-registry/projectpulse-frontend:$(GIT_COMMIT)`
    *   `docker push your-registry/projectpulse-frontend:latest`

**Artifacts:** Versioned Docker images in a private registry.

### Stage 4: API & Integration Testing (E2E)

**Trigger:** Successful completion of "Docker Image Build & Push" stage.
**Environment:** Deploy a temporary staging environment using the newly built Docker images.

**Steps:**

1.  **Deploy Staging Environment:**
    *   Use `docker-compose up -d` or Kubernetes manifests to deploy `backend`, `frontend`, and `db` (or connect to a dedicated test DB).
2.  **Run API Tests:**
    *   Execute API tests (e.g., Postman collections via Newman, or dedicated API testing frameworks like RestAssured/Karate).
    *   These tests should cover end-to-end user flows, including authentication, project/task CRUD, and permission checks.
3.  **Run UI E2E Tests (Optional but Recommended):**
    *   Execute UI end-to-end tests using tools like Cypress, Selenium, or Playwright to verify full application functionality.
4.  **Teardown Staging Environment:** Remove the temporary deployment.

**Reporting:** Publish API/E2E test reports.

### Stage 5: Performance Testing (Optional)

**Trigger:** Scheduled or manual trigger after "API & Integration Testing" stage.

**Steps:**

1.  **Deploy Dedicated Performance Environment:** Deploy a clean environment (identical to production as much as possible).
2.  **Run JMeter Tests:**
    *   Execute JMeter test plans (as described in `README.md`) to simulate load and measure performance metrics (response times, throughput, error rates).
3.  **Analyze Results:** Compare current performance metrics against baselines. Fail if performance regressions or critical bottlenecks are detected.
4.  **Teardown Performance Environment.**

**Reporting:** Publish performance test reports and graphs.

### Stage 6: Deployment to Staging/Production

**Trigger:**
*   **Staging:** Successful completion of "API & Integration Testing" stage.
*   **Production:** Manual approval or scheduled release.

**Steps:**

1.  **Deploy to Staging:**
    *   Pull the `latest` Docker images (or specific `GIT_COMMIT` tags) to the staging server.
    *   `docker-compose pull && docker-compose up -d --remove-orphans` (for Docker Compose) or apply Kubernetes manifests.
    *   Run smoke tests post-deployment to ensure basic functionality.
2.  **Manual Acceptance Testing (Staging):** Business stakeholders review the new features and ensure everything works as expected.
3.  **Deploy to Production:**
    *   Similar steps as staging deployment, but targeting production infrastructure.
    *   Implement blue/green deployment or canary releases for zero-downtime updates if possible.
    *   Run final smoke tests.
    *   **Rollback Strategy:** Have a clear plan and automated mechanism to roll back to the previous stable version if issues are detected post-deployment.

**Notifications:** Send notifications to relevant teams (e.g., Slack, email) about deployment status.

## 3. Example GitHub Actions Workflow (Conceptual `backend.yml`)

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    env:
      DB_NAME: testdb
      DB_USERNAME: testuser
      DB_PASSWORD: testpassword
      JWT_SECRET: aStrongSecretForCIEnvironmentProjectPulse
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: ${{ env.DB_NAME }}
          POSTGRES_USER: ${{ env.DB_USERNAME }}
          POSTGRES_PASSWORD: ${{ env.DB_PASSWORD }}
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Wait for Postgres to be ready
        run: |
          for i in `seq 1 10`; do
            nc -z localhost 5432 && echo "Postgres is up!" && break
            echo "Waiting for Postgres..."
            sleep 5
          done

      - name: Build and run tests
        run: |
          cd backend
          # Configure test properties to use the service container
          sed -i 's|jdbc:tc:postgresql:15-alpine:///testdb|jdbc:postgresql://localhost:5432/${{ env.DB_NAME }}|g' src/test/resources/application-test.yml
          sed -i 's|org.testcontainers.jdbc.ContainerDatabaseDriver|org.postgresql.Driver|g' src/test/resources/application-test.yml
          sed -i 's|spring.datasource.url.*|spring.datasource.url=jdbc:postgresql://localhost:5432/${{ env.DB_NAME }}|g' src/test/resources/application-test.yml
          sed -i 's|spring.datasource.username.*|spring.datasource.username=${{ env.DB_USERNAME }}|g' src/test/resources/application-test.yml
          sed -i 's|spring.datasource.password.*|spring.datasource.password=${{ env.DB_PASSWORD }}|g' src/test/resources/application-test.yml
          
          # Build and run tests with JaCoCo for coverage
          ./mvnw clean verify -Pcoverage # 'verify' phase includes tests
        working-directory: ./backend

      - name: Upload JaCoCo report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: jacoco-report
          path: backend/target/site/jacoco/

  build-and-push-docker:
    needs: build-and-test
    if: github.ref == 'refs/heads/main' #