```markdown
# Performance Monitoring System: Architecture Documentation

This document provides a high-level overview of the architecture of the Performance Monitoring System.

## 1. High-Level Overview

The system is designed as a modular, full-stack web application, following a client-server architecture with a clear separation of concerns. It comprises a React-based frontend, a Node.js/Express backend, and a PostgreSQL database for persistence, augmented with Redis for caching and session management.

```
+-------------------+       +------------------------+       +-------------------+
| Monitored App (N) | <---> | Backend API (Ingestion)| <---> | PostgreSQL (Data) |
+-------------------+       +------------------------+       +-------------------+
                                         ^
                                         | (API calls, JWT)
                                         |
+---------------------+      +------------------------+
| Frontend (Dashboard)| <--->| Backend API (Query/Mgmt)| <---> | Redis (Cache/Sess)|
+---------------------+      +------------------------+       +-------------------+
```

## 2. Component Breakdown

### 2.1. Frontend (Client-side)

*   **Technology:** React.js, React Router, Axios, Chart.js (for data visualization).
*   **Purpose:** Provides a user-friendly interface for managing projects, viewing performance dashboards, configuring alerts, and monitoring triggered incidents.
*   **Key Responsibilities:**
    *   User authentication (Login, Register).
    *   Project CRUD operations.
    *   Fetching and visualizing aggregated performance metrics in charts.
    *   Displaying raw metric data (conceptual).
    *   Alert definition and incident management.
    *   Responsive UI/UX.
*   **Interaction:** Communicates with the Backend API via HTTP requests (Axios), using JWT for authentication.

### 2.2. Backend (Server-side)

*   **Technology:** Node.js, Express.js.
*   **Purpose:** Serves as the central API gateway, handling all client requests, metric ingestion, data storage, and business logic.
*   **Key Modules & Responsibilities:**
    *   **Authentication & Authorization (`auth.middleware.js`, `authService.js`, `authController.js`):**
        *   User registration and login (email/password).
        *   JWT-based authentication for user sessions.
        *   API Key-based authentication for secure metric ingestion.
        *   Session management using `express-session` with `connect-redis`.
    *   **Project Management (`projectService.js`, `projectController.js`, `projectRepository.js`):**
        *   CRUD operations for monitoring projects.
        *   Generation and management of unique API keys for each project.
        *   Ensuring user ownership of projects.
    *   **Metric Ingestion (`metricService.js`, `metric