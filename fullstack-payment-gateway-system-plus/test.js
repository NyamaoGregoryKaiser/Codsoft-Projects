2.  **Update `docker-compose.yml` for Production:**
    Edit the `docker-compose.yml` on your server:
    *   **Remove `database` service:** If using an external database.
    *   **Update `backend` service:**
        *   Change `build` to `image: your_registry/securepay-backend:latest`
        *   Update `DATABASE_URL` environment variable to point to your external PostgreSQL instance.
        *   Set `JWT_SECRET` environment variable to a strong, random value.
    *   **Update `frontend` service:**
        *   Change `build` to `image: your_registry/securepay-frontend:latest`
        *   Adjust `volumes` to mount your actual Nginx config for HTTPS and SSL certs.
    **Example Production `docker-compose.yml`:**