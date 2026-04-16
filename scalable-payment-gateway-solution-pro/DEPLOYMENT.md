```markdown
# Payment Processing System - Deployment Guide

This document outlines the steps for deploying the Payment Processing System to various environments.

## 1. Local Development (Docker Compose)

Refer to the [README.md #Running with Docker Compose](#running-with-docker-compose) section for local setup using `docker-compose`.

## 2. Development/Staging Environments (Example: Single Server with Docker)

This section describes a basic deployment to a Linux server using Docker. For more complex setups, consider container orchestration tools like Kubernetes.

### Prerequisites

*   A Linux server (e.g., Ubuntu, CentOS)
*   Docker and Docker Compose installed on the server.
*   SSH access to the server.
*   A running PostgreSQL database (can be on the same server, or a managed cloud database).
*   DNS record pointing to your server's IP (optional, but recommended for accessibility).

### Steps

1.  **Clone Repository or Transfer Artifacts:**
    *   **Option A (Clone & Build on Server):**
        ```bash
        # On your server
        git clone https://github.com/your-username/payment-processor.git
        cd payment-processor
        docker build -t payment-processor-app -f docker/Dockerfile .
        ```
    *   **Option B (Build Locally & Transfer JAR/Image):**
        *   Build the JAR locally: `mvn clean package -DskipTests`
        *   Copy the JAR to server: `scp target/payment-processor-0.0.1-SNAPSHOT.jar user@your-server-ip:/opt/payment-processor/app.jar`
        *   Alternatively, push your Docker image to a private registry (e.g., Docker Hub, AWS ECR, GCR) and pull it on the server.

2.  **Prepare Environment Variables:**
    *   Create a `.env` file on the server (e.g., `/opt/payment-processor/.env`) with production-ready environment variables:
        ```env
        DB_HOST=your_db_host # e.g., localhost, or RDS endpoint
        DB_PORT=5432
        DB_NAME=payment_processor_prod
        DB_USER=prod_db_user
        DB_PASSWORD=your_secure_db_password
        JWT_SECRET=a_much_longer_and_more_random_secret_for_production_jwt_tokens # IMPORTANT!
        SPRING_PROFILES_ACTIVE=prod # If you have a 'prod' application.yml
        ```
    *   Ensure your `application.yml` correctly references these environment variables (e.g., `${DB_HOST}`).

3.  **Run Database Migrations:**
    *   If your `application.yml` is configured for `flyway.enabled=true` and `ddl-auto=validate`, the application will run migrations on startup.
    *   Ensure the database user has migration permissions.
    *   Alternatively, you can run Flyway manually from your local machine against the remote database:
        ```bash
        # Ensure application.yml has prod DB details configured locally
        mvn flyway:migrate
        ```

4.  **Deploy and Run the Application:**
    *   **If you built the Docker image on the server or pushed to a registry:**
        ```bash
        # On your server
        docker stop payment-processor-prod || true
        docker rm payment-processor-prod || true
        docker run -d --name payment-processor-prod \
          -p 80:8080 \ # Map port 80 to 8080 (for HTTPS later with Nginx)
          --restart always \ # Automatically restart if it crashes
          --env-file /opt/payment-processor/.env \
          payment-processor-app:latest # Or your image from registry
        ```
    *   **If you transferred the JAR:**
        ```bash
        # On your server
        # First, ensure you have the OpenJDK 17 JRE image
        docker pull openjdk:17-jre-slim

        docker stop payment-processor-prod || true
        docker rm payment-processor-prod || true
        docker run -d --name payment-processor-prod \
          -p 80:8080 \
          --restart always \
          --env-file /opt/payment-processor/.env \
          -v /opt/payment-processor/app.jar:/app/app.jar \
          openjdk:17-jre-slim java -jar /app/app.jar
        ```

5.  **Configure Reverse Proxy (Nginx/Apache - Recommended for Production):**
    *   Install Nginx/Apache.
    *   Configure it to:
        *   Listen on port 443 (HTTPS) and redirect HTTP to HTTPS.
        *   Proxy requests to your Spring Boot application (e.g., `http://localhost:8080`).
        *   Handle SSL termination (using Let's Encrypt for free certificates).
    *   Example Nginx configuration snippet:
        ```nginx
        server {
            listen 80;
            listen [::]:80;
            server_name your-domain.com;
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl http2;
            listen [::]:443 ssl http2;
            server_name your-domain.com;

            ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
            ssl_session_cache shared:SSL:10m;
            ssl_session_timeout 1d;
            ssl_session_tickets off;
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_prefer_server_ciphers on;
            ssl_ciphers "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20";
            ssl_stapling on;
            ssl_stapling_verify on;

            location / {
                proxy_pass http://localhost:8080;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```

6.  **Verify Deployment:**
    *   Check Docker container logs: `docker logs payment-processor-prod`
    *   Access the application via your domain or server IP.
    *   Check Swagger UI: `https://your-domain.com/swagger-ui.html`
    *   Check Actuator Health: `https://your-domain.com/actuator/health`

## 3. Kubernetes Deployment (Conceptual)

For production-grade, highly available, and scalable deployments, Kubernetes is the recommended choice.

### Key Kubernetes Resources

*   **Deployment:** Manages the stateless Spring Boot application pods.
    *   `replicas`: Configure desired number of instances.
    *   `resources`: Define CPU/memory limits and requests.
    *   `image`: Your Docker image from a registry.
*   **Service:** Provides a stable IP address and DNS name for your application pods.
    *   `type: ClusterIP` for internal access.
    *   `type: LoadBalancer` or `NodePort` for external access, often combined with an Ingress.
*   **Ingress:** Manages external access to services in a cluster, providing HTTP/S routing, SSL termination, and virtual hosting.
*   **ConfigMap / Secret:** Securely manage application configuration and sensitive data (e.g., database credentials, JWT secret).
    *   `Secrets` for sensitive data (base64 encoded).
    *   `ConfigMaps` for non-sensitive configuration.
*   **PersistentVolume / PersistentVolumeClaim:** For stateful services (like a database *if* run inside Kubernetes, though managed databases are often preferred).
*   **HorizontalPodAutoscaler (HPA):** Automatically scales the number of pods based on CPU utilization or other custom metrics.

### High-Level Steps

1.  **Containerize Application:** Ensure `Dockerfile` is optimized and push to a registry.
2.  **Create Kubernetes Manifests:** Define `Deployment`, `Service`, `Ingress`, `ConfigMap`, `Secret` YAML files.
3.  **Apply Manifests:** `kubectl apply -f your-manifests/`
4.  **Monitor:** Use Kubernetes dashboards, Prometheus, Grafana to monitor the cluster and application.

### Example Secret (secret.yaml)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: payment-processor-secrets
type: Opaque
stringData: # Use stringData for convenience, kubectl will base64 encode
  db_password: "your_secure_db_password"
  jwt_secret: "a_much_longer_and_more_random_secret_for_production_jwt_tokens"
  # ... other secrets
```

### Example Deployment (deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor-app
  labels:
    app: payment-processor
spec:
  replicas: 3 # Run multiple instances for high availability
  selector:
    matchLabels:
      app: payment-processor
  template:
    metadata:
      labels:
        app: payment-processor
    spec:
      containers:
        - name: payment-processor
          image: your-docker-registry/payment-processor-app:latest # Replace with your image
          ports:
            - containerPort: 8080
          env:
            - name: DB_HOST
              value: "your-managed-db-endpoint" # Use a managed database service
            - name: DB_PORT
              value: "5432"
            - name: DB_NAME
              value: "payment_processor_prod"
            - name: DB_USER
              value: "prod_db_user"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: payment-processor-secrets
                  key: db_password
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: payment-processor-secrets
                  key: jwt_secret
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
          livenessProbe: # Kubernetes health check
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 20
            periodSeconds: 5
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1024Mi"
              cpu: "500m"
```

---

**Always prioritize security for production deployments:**
*   Use strong, unique passwords and API keys.
*   Store secrets securely (e.g., environment variables, Kubernetes Secrets, AWS Secrets Manager).
*   Regularly update dependencies to patch vulnerabilities.
*   Implement network segmentation and firewalls.
*   Enable and review audit logs.
*   Perform regular security audits and penetration testing.
```