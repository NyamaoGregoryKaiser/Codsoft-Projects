*   `--build`: Builds images from Dockerfiles. This is important for the first run or after code changes.
    *   `-d`: Runs the services in detached mode (in the background).

    This command will:
    *   Build the `db` (PostgreSQL), `backend` (C++ Drogon API), `frontend` (React), and `nginx` images.
    *   Start all containers.
    *   Initialize the PostgreSQL database with schema and seed data (from `db/init.sql`).
    *   The `nginx` container will serve the React frontend static files and act as a reverse proxy for the C++ backend API.

4.  **Check service status (optional):**