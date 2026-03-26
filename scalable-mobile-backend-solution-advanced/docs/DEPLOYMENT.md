```markdown
# Mobile Backend Deployment Guide

This guide outlines the steps to deploy the Mobile Backend system using Docker and Docker Compose for local development, and conceptually for a production environment.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

-   **Docker**: [Install Docker Engine](https://docs.docker.com/engine/install/)
-   **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/) (usually comes with Docker Desktop)
-   **Git**: [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## 2. Local Deployment with Docker Compose

This is the recommended way to run the entire stack (backend app, PostgreSQL, Redis) on your local machine.

### 2.1. Clone the Repository

```bash
git clone https://github.com/your-repo/mobile-backend.git
cd mobile-backend
```

### 2.2. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file to set your desired configurations. **Crucially, change `APP_JWT_SECRET` to a strong, unique secret.**

```ini
# .env file content example (modify as needed)
APP_PORT=8080
APP_THREADS=4
APP_NAME="MobileBackend"
APP_JWT_SECRET="YOUR_SUPER_SECURE_JWT_KEY_FOR_PROD_DO_NOT_USE_DEFAULT" # <--- IMPORTANT: Change this!
APP_LOG_LEVEL="info"

DB_HOST=postgres
DB_PORT=5432
DB_USER=mobile_user
DB_PASSWORD=mobile_password
DB_NAME=mobile_backend_db

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD="" # Set a strong password for Redis in production
REDIS_DB_INDEX=0

RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.3. Build and Run Services

From the root of the project directory, run:

```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

-   `--build`: Rebuilds the application image. Use this when you make changes to the C++ code or Dockerfile.
-   `-d`: Runs the services in detached mode (in the background).

This command will:
1.  Build the `mobile_backend_app` Docker image based on `docker/Dockerfile`.
2.  Start three containers: `mobile_backend_app`, `mobile_backend_postgres`, and `mobile_backend_redis`.
3.  The PostgreSQL container will automatically run the SQL migration scripts located in `database/migrations/` on its first startup.

### 2.4. Verify Deployment

-   **Check container status**:
    ```bash
    docker-compose -f docker/docker-compose.yml ps
    ```
    You should see `Up` for all three services.

-   **View application logs**:
    ```bash
    docker-compose -f docker/docker-compose.yml logs -f app
    ```
    You should see Drogon's startup messages and potentially logs from your application.

-   **Test API**:
    Open your browser or use `curl` to access the health check endpoint:
    ```bash
    curl http://localhost:8080/api/v1/
    ```
    You should get a `200 OK` response.

### 2.5. Stop and Remove Services

To stop the running services:

```bash
docker-compose -f docker/docker-compose.yml down
```

To stop and remove containers, networks, and volumes (useful for a clean slate, but will delete database data):

```bash
docker-compose -f docker/docker-compose.yml down -v
```

## 3. Production Deployment Considerations

For a production environment, several additional steps and considerations are crucial for security, reliability, and scalability.

### 3.1. Infrastructure Setup

-   **Cloud Provider**: AWS, GCP, Azure, DigitalOcean, etc.
-   **Virtual Machines / Managed Services**:
    -   **Backend App**: Deploy on EC2, GCE, or a container orchestration service (EKS, GKE, AKS).
    -   **PostgreSQL**: Use a managed database service (RDS, Cloud SQL, Azure Database for PostgreSQL) for high availability, backups, and easier management.
    -   **Redis**: Use a managed caching service (ElastiCache, Memorystore, Azure Cache for Redis).
-   **Networking**:
    -   Configure VPC/VNet, subnets, security groups, and network ACLs for secure communication between services.
    -   Only expose necessary ports (e.g., 80/443 for the load balancer) to the public internet.

### 3.2. Security

-   **HTTPS**: Always use HTTPS. Terminate SSL at a load balancer or API Gateway.
-   **Environment Variables**: Manage sensitive environment variables (DB passwords, JWT secrets) securely using services like AWS Secrets Manager, Vault, or Kubernetes Secrets. **NEVER commit sensitive credentials to your repository.**
-   **Database Access**: Restrict database access to only the backend application. Use strong, unique passwords.
-   **Firewalls**: Configure strict firewall rules to allow traffic only from trusted sources.
-   **Least Privilege**: Run the application and database users with the minimum necessary permissions.
-   **Image Scanning**: Use Docker image scanning tools to identify vulnerabilities in your base images and dependencies.

### 3.3. Scaling and High Availability

-   **Load Balancer**: Deploy an Nginx, HAProxy, or cloud-native load balancer (e.g., AWS ALB) in front of multiple backend application instances.
-   **Horizontal Scaling**: Run multiple instances of the backend application behind the load balancer. Container orchestration platforms (Kubernetes) simplify this.
-   **Database Replication**: Set up PostgreSQL master-replica replication for read scalability and disaster recovery.
-   **Redis Clustering/Sentinel**: For high-availability and read scaling of Redis.
-   **Health Checks**: Configure health checks for your application instances so the load balancer can route traffic away from unhealthy instances.

### 3.4. Monitoring and Logging

-   **Centralized Logging**: Ship application logs (from `spdlog`) to a centralized logging system (e.g., ELK Stack, Splunk, Datadog, CloudWatch Logs).
-   **Monitoring**: Use monitoring tools (Prometheus/Grafana, Datadog, New Relic, Cloud Monitoring) to track application metrics (CPU, memory, network, request rates, error rates, latency).
-   **Alerting**: Set up alerts for critical events (e.g., high error rates, service downtime, low disk space).

### 3.5. CI/CD Pipeline

-   Automate the build, test, and deployment process using tools like GitHub Actions, GitLab CI/CD, Jenkins, CircleCI, Travis CI.
-   The `ci-cd/github-actions.yml` provides a basic example. In production, this would also include:
    -   Automated Docker image pushing to a private container registry.
    -   Automated deployment to staging/production environments.
    -   Integration with monitoring and alerting systems.

### 3.6. Database Migrations

-   For production, use a dedicated database migration tool (e.g., Flyway, Liquibase, or a custom script runner) that can safely apply schema changes without data loss. Ensure migrations are idempotent.

## 4. Example: Deploying to a Single Linux VM (Manual Steps)

While not recommended for large-scale production, this demonstrates a basic production-like setup on a single VM.

1.  **Prepare the VM**:
    -   Provision a Linux VM (e.g., Ubuntu 22.04).
    -   Install Docker and Docker Compose:
        ```bash
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose
        sudo usermod -aG docker $USER # Add your user to the docker group
        # You might need to log out and back in for group changes to take effect
        ```

2.  **Copy Project Files**:
    -   SSH into your VM.
    -   Clone the repository:
        ```bash
        git clone https://github.com/your-repo/mobile-backend.git
        cd mobile-backend
        ```

3.  **Configure `.env`**:
    -   Create and secure your `.env` file as described in section 2.2.
    -   **Important**: Make sure `APP_JWT_SECRET` and `REDIS_PASSWORD` (if set) are strong and unique.

4.  **Run with Docker Compose**:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```

5.  **Configure Firewall**:
    -   Open port `8080` (or your chosen `APP_PORT`) in your VM's firewall (e.g., `ufw` on Ubuntu, or security groups in cloud environments) to allow external access.
    ```bash
    sudo ufw allow 8080/tcp
    sudo ufw enable
    ```

This setup provides a basic running system. For true production readiness, invest in the scaling, security, and monitoring aspects discussed above.
```