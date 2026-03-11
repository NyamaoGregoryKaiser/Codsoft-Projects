---

### 6. Additional Features

**Authentication/Authorization**: Implemented using JWT in `JwtUtils.h/cc` and `JwtMiddleware.h/cc`, with role-based checks in `ProductController.cc`.

**Logging and Monitoring**:
*   **Backend**: Drogon has built-in logging, configured in `backend/config/config.json.template` and `main.cc`. `LOG_DEBUG`, `LOG_INFO`, `LOG_WARN`, `LOG_ERROR` macros are used.
*   **Docker**: All service logs can be viewed with `docker-compose logs`.
*   **Conceptual Monitoring**: `ARCHITECTURE.md` and `DEPLOYMENT.md` discuss integrating Prometheus/Grafana and centralized log management.

**Error Handling Middleware**:
*   **Backend**: A custom error handler is set in `main.cc` using `drogon::app().setCustomErrorHandler()`, which catches unhandled exceptions and returns a generic 500 JSON response. Specific controllers (e.g., `ProductController`) also return structured JSON error responses (e.g., 400, 404, 401, 403) based on business logic failures.
*   **Frontend**: `apiClient.js` uses `axios` interceptors, and components handle `try-catch` blocks for API calls.

**Caching Layer**:
*   **Backend**: The current implementation doesn't have a full caching layer. For demonstration, a conceptual `std::map` based in-memory cache could be added to `ProductService` for `getAllProducts()` or `getProductById()`.
    *   *Conceptual implementation idea:*