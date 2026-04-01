Check the logs for any errors. Look for messages indicating successful startup of the backend and frontend.

3.  **Access the application:**
    *   Open your web browser and navigate to `http://your_server_ip:3000` (or your configured frontend port).
    *   You should see the login page of the Database Optimization System.
    *   Login with the default admin credentials (`admin`/`adminpass` - **remember the security warning about password hashing!**).

### Managing the Deployment

*   **Stop services:** `sudo docker compose stop`
*   **Restart services:** `sudo docker compose restart`
*   **Stop and remove containers, networks, and volumes:** `sudo docker compose down` (use with caution in production as this removes DB data volume by default unless external volumes are used).
*   **Update application (after code changes):**
    1.  `sudo git pull` (to get latest code)
    2.  `sudo docker compose build --no-cache`
    3.  `sudo docker compose up -d` (this will recreate containers with new images)

## 4. Deployment to Kubernetes (Conceptual)

For larger-scale, highly available deployments, Kubernetes is the preferred platform. The provided `docker-compose.yml` can serve as a blueprint.

**Key Steps:**

1.  **Container Registry**: Ensure your Docker images are pushed to a private container registry (e.g., Docker Hub, GCR, ECR).
2.  **Kubernetes Manifests**: Convert `docker-compose.yml` into Kubernetes manifests:
    *   `Deployment` for `backend` and `frontend`.
    *   `Service` for `backend` and `frontend` (ClusterIP for backend, LoadBalancer/NodePort for frontend).
    *   `Ingress` for public access to the frontend (with TLS termination).
    *   `StatefulSet` and `PersistentVolumeClaim` for the PostgreSQL database to ensure data persistence.
    *   `Secret` for sensitive environment variables (JWT secret, DB password).
    *   `ConfigMap` for non-sensitive configuration.
3.  **Apply Manifests**: Use `kubectl apply -f your-manifests/` to deploy to your Kubernetes cluster.
4.  **Monitoring**: Integrate with Kubernetes-native monitoring (e.g., Prometheus Operator) and logging (e.g., Fluentd + ELK).

## 5. Post-Deployment Checks

After successful deployment:

*   **Security Audit**: Conduct a security review (e.g., penetration testing, vulnerability scanning).
*   **Performance Benchmarking**: Run performance tests with `wrk` (as shown in `tests/performance/api_load_test.sh`) to establish baselines and verify performance under load.
*   **Log Monitoring**: Ensure logs are flowing correctly to your centralized logging system.
*   **Error Reporting**: Verify that error alerts are configured and functioning.
*   **Backup Strategy**: Implement a robust database backup and restore strategy for PostgreSQL data.
*   **Disaster Recovery**: Develop and test a disaster recovery plan.

By following this guide and considering the production best practices, you can successfully deploy the Database Optimization System in your environment.