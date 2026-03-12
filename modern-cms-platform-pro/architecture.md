# CMS Project Architecture

This document outlines the high-level architecture of the Content Management System.

## 1. System Overview

The CMS is built as a full-stack web application with a clear separation of concerns between the backend API and the frontend user interface. It follows a microservices-like approach using Docker containers for each major component, orchestrated by Docker Compose for development.

![CMS Architecture Diagram](https://mermaid.live/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBTdWVyTmV0d29yazhcdGIoQ2xvdWQgUHJvdmlkZXIvRHJDZW50ZXIpXG4gICAgc3ViZ3JhcGggQ2xpZW50XG4gICAgICAgIFVzZXJcdHRtZXsodXNlcnkpf1xuICAgICAgICBEZXZpY2VcdHRtZXsodXNlciBhY2Nlc3NlcyB0byBGUm9udGVuZCk6OnMubm9kZVxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggRGVwbG95ZWQgQXBwbGljYXRpb24gS2VybjpcbiAgICAgICAgTmdpbnhbd2ViIHNlcnZlcjo6czpub2RlXSAtLS0gc2VydmVzIGZyb250ZW5kLyBwcm94eSBmb3IgYmFja2VuZCAtLS0_IEZyb250ZW5kRmVcc3RhdGljIGZpbGVzXTtcbiAgICAgICAgTmdpbnhidWlsdGVyW05naW54IFJldmVyc2UgUHJveHk6OnMubm9kZV0gLS0tIHByb3h5IHRvIFs2dW5pY29ybmJhY2tlbmRcU0VydmVyXTtbOjo=)
```mermaid
graph TD
    subgraph Client
        User((User))
        Browser[Browser/Client App] --> |HTTP/HTTPS| NginxGateway
    end

    subgraph Infrastructure (Cloud / Server)
        NginxGateway[Nginx Reverse Proxy]
        BackendContainer[Backend (Django/Gunicorn)]
        FrontendContainer[Frontend (React/Nginx Static)]
        DB[PostgreSQL Database]
        Cache[Redis Cache]

        NginxGateway -- serves static files --> FrontendContainer
        NginxGateway -- proxies API requests --> BackendContainer

        BackendContainer -- stores data --> DB
        BackendContainer -- caches data --> Cache
    end

    style User fill:#fff,stroke:#333,stroke-width:2px
    style Browser fill:#ADD8E6,stroke:#333,stroke-width:2px
    style NginxGateway fill:#FFD700,stroke:#333,stroke-width:2px
    style BackendContainer fill:#90EE90,stroke:#333,stroke-width:2px
    style FrontendContainer fill:#ADD8E6,stroke:#333,stroke-width:2px
    style DB fill:#E0FFFF,stroke:#333,stroke-width:2px
    style Cache fill:#FFC0CB,stroke:#333,stroke-width:2px
```

## 2. Component Breakdown

### 2.1 Frontend (React)

*   **Purpose:** Provides the user interface for both public-facing content and the administrative panel.
*   **Technologies:** React, Chakra UI, React Router DOM, Axios.
*   **Key Responsibilities:**
    *   Rendering UI components and pages.
    *   Handling user interactions.
    *   Client-side routing.
    *   Consuming backend API endpoints.
    *   Managing local state and authentication tokens.
*   **Architecture:** Component-based, leveraging React Context for global state (e.g., authentication).
*   **Deployment:** Built into static assets and served by Nginx.

### 2.2 Backend (Django REST Framework)

*   **Purpose:** Exposes a RESTful API for content management, user authentication, and serves as the primary business logic layer.
*   **Technologies:** Python, Django, Django REST Framework, djangorestframework-simplejwt, Pillow.
*   **Key Responsibilities:**
    *   Defining data models (Users, Posts, Pages, Categories, Tags, Media, Revisions).
    *   Implementing CRUD operations via API endpoints.
    *   Handling authentication (JWT) and authorization (permissions).
    *   Processing business logic (e.g., slug generation, content publishing workflow, revision history).
    *   Managing media uploads and storage.
    *   Interacting with the database and caching layer.
*   **Deployment:** Runs as a WSGI application (Gunicorn) behind a reverse proxy (Nginx).

### 2.3 Database (PostgreSQL)

*   **Purpose:** Persistent storage for all application data.
*   **Technologies:** PostgreSQL.
*   **Key Responsibilities:**
    *   Storing user information, content, media metadata, categories, tags, and revision history.
    *   Ensuring data integrity and relationships.
*   **Optimization:** Django ORM's `select_related` and `prefetch_related` are used to minimize database queries.

### 2.4 Caching (Redis)

*   **Purpose:** Improves API response times by caching frequently accessed data.
*   **Technologies:** Redis.
*   **Key Responsibilities:**
    *   Storing API responses for read-heavy endpoints (e.g., listing published posts, categories).
    *   Session caching (optional, though Django's default session handling can also use database).
*   **Integration:** Django's caching framework with `django-redis` backend.

### 2.5 Gateway / Reverse Proxy (Nginx)

*   **Purpose:** Serves as the entry point for all client requests.
*   **Technologies:** Nginx.
*   **Key Responsibilities:**
    *   **Static File Serving:** Efficiently serves frontend static assets (HTML, CSS, JS, images).
    *   **API Proxying:** Forwards API requests to the backend Django application.
    *   **SSL Termination:** (In production) Handles HTTPS, offloading SSL encryption/decryption from backend.
    *   **Load Balancing:** (In production with multiple backend instances) Distributes traffic.
    *   **Request Filtering/Security:** Basic request validation and security headers.

## 3. Data Flow

1.  **Client Request:** A user interacts with the React frontend in their browser.
2.  **Frontend Routing/API Call:**
    *   For UI navigation, React Router handles client-side routing.
    *   For data, the React app makes an asynchronous HTTP request (using `axios`) to the Nginx gateway.
3.  **Nginx Gateway:**
    *   If the request is for a static file (e.g., `/static/js/main.chunk.js`), Nginx serves it directly from the Frontend container's build directory.
    *   If the request is an API call (e.g., `/api/v1/posts/`), Nginx proxies it to the Backend (Django/Gunicorn) container.
4.  **Backend (Django/Gunicorn):**
    *   **Authentication:** JWT token in the `Authorization` header is validated.
    *   **Rate Limiting:** Request frequency is checked.
    *   **Caching:** Checks if the requested data is in Redis cache. If yes and valid, returns cached data.
    *   **Database Interaction:** If not cached, the Django ORM queries PostgreSQL.
    *   **Business Logic:** Applies any necessary transformations, validations, or logic (e.g., slug generation, permission checks).
    *   **Response Generation:** Data is serialized into JSON.
    *   **Caching (Write):** If data was fetched from DB, it might be stored in Redis cache for future requests.
5.  **Backend to Nginx:** The JSON response is sent back to Nginx.
6.  **Nginx to Client:** Nginx forwards the JSON response to the client's browser.
7.  **Frontend Rendering:** The React app receives the JSON data and updates the UI accordingly.

## 4. Security Considerations

*   **Authentication:** JWT tokens ensure stateless authentication for API, with refresh tokens for extended sessions. Session-based authentication is used for the Django Admin.
*   **Authorization:** Role-based permissions are enforced at the API level (Django REST Framework).
*   **HTTPS:** Critical for production to encrypt all traffic. Nginx handles SSL termination.
*   **CORS:** Configured to allow specific origins in production, preventing unauthorized cross-origin requests.
*   **Input Validation:** Performed at both frontend and backend (Django forms/serializers) to prevent injection attacks and ensure data integrity.
*   **Secret Management:** Environment variables are used for sensitive configurations (`SECRET_KEY`, database credentials). Docker Compose uses `.env` files.
*   **Logging & Monitoring:** Robust logging helps detect and diagnose security incidents and application errors.

## 5. Scalability & Performance

*   **Containerization:** Allows for easy scaling of individual services (e.g., multiple backend instances).
*   **Load Balancing:** Nginx can distribute requests across multiple backend instances.
*   **Caching:** Redis significantly reduces database load for read-heavy operations.
*   **Database Indexing:** Django migrations automatically create indices for primary/foreign keys. Further custom indices can be added for performance-critical queries.
*   **Asynchronous Tasks (Future):** For long-running operations (e.g., complex image processing, email sending), integrating a task queue like Celery with Redis could improve responsiveness.
*   **Static File Serving:** Nginx is highly optimized for serving static assets, reducing load on the backend application.

This architecture provides a solid foundation for a modern, scalable, and maintainable CMS.
```

#### `deployment.md`

```markdown