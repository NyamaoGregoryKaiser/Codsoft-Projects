# Testing Strategy: Web Scraping Tools System

This document outlines the testing strategy for the Web Scraping Tools System, covering unit, integration, API, and performance tests, with an aim for high code coverage and quality.

## 1. Testing Principles

*   **Automated:** All tests should be executable automatically.
*   **Fast:** Unit tests should run quickly.
*   **Reliable:** Tests should produce consistent results.
*   **Comprehensive:** Cover critical paths, edge cases, and error conditions.
*   **Maintainable:** Tests should be easy to read, understand, and update.

## 2. Test Types and Tools

### 2.1. Backend Tests (Python)

*   **Framework:** `pytest`
*   **Coverage:** `pytest-cov` (aim for 80%+ line coverage)
*   **HTTP Client:** `httpx` (for API tests)
*   **Async Testing:** `pytest-asyncio`

#### 2.1.1. Unit Tests

*   **Purpose:** To test individual functions, methods, or small classes in isolation. Mock external dependencies (database, API calls, Playwright) where appropriate.
*   **Coverage:** `app/crud/`, `app/core/security.py`, `app/services/scraper_runner.py` (individual functions).
*   **Example Files:**
    *   `backend/tests/unit/test_crud_users.py`: Tests CRUD operations for users.
    *   `backend/tests/unit/test_scraper_runner.py`: Tests `extract_data_from_page` logic by mocking Playwright components.

#### 2.1.2. API / Integration Tests

*   **Purpose:** To test the interaction between multiple components, particularly API endpoints, database interactions, and authentication/authorization logic. These tests hit the FastAPI application.
*   **Coverage:** `app/api/v1/` endpoints.
*   **Setup:** Uses `TestClient` from FastAPI, a dedicated test database, and mock Redis where direct integration is complex or slow.
*   **Example Files:**
    *   `backend/tests/api/test_auth.py`: Tests login, token generation, and token validation.
    *   `backend/tests/api/test_users.py`: Tests CRUD operations for user management via API.
    *   `backend/tests/api/test_scrapers.py`: Tests scraper creation, retrieval, and triggering jobs.
    *   `backend/tests/api/test_jobs.py`: Tests job retrieval.
    *   `backend/tests/api/test_data.py`: Tests scraped data retrieval.
*   **Fixtures:** `backend/tests/conftest.py` provides essential fixtures for API tests:
    *   `db_session`: Isolated database session with rollback.
    *   `client`: FastAPI `TestClient`.
    *   `superuser_token_headers`, `normal_user_token_headers`: Authenticated headers for testing access control.
    *   `setup_test_db`: Creates/drops test database schema.
    *   `redis_client`: Provides a clean Redis client for each test (useful for rate-limiting, caching tests).

#### Running Backend Tests

1.  Ensure you have your Docker Compose environment running or at least the `db` and `redis` services.
2.  Navigate to the `backend` directory.
3.  Install dependencies: `pip install -r requirements.txt` (or `docker-compose exec backend bash` to run inside container).
4.  Run tests:
    ```bash
    pytest --cov=app --cov-report=term-missing tests/
    ```
    This command will run all tests, calculate code coverage, and report missing lines.

### 2.2. Frontend Tests (React)

*   **Framework:** `Jest`
*   **Tools:** `React Testing Library` (for user-centric tests), `MSW` (Mock Service Worker, for API mocking).
*   **Coverage:** Component rendering, user interactions, state management, API calls within components.

#### 2.2.1. Unit/Component Tests

*   **Purpose:** To test individual React components in isolation. Verify rendering, props handling, and basic user interactions.
*   **Coverage:** `frontend/src/components/`, `frontend/src/hooks/`.
*   **Example (Conceptual `AuthForm.test.js`):**
    ```javascript
    // frontend/src/components/AuthForm.test.js
    import { render, screen, fireEvent, waitFor } from '@testing-library/react';
    import AuthForm from './AuthForm';
    import { AuthContext } from '../contexts/AuthContext'; // Mock this
    import { BrowserRouter as Router } from 'react-router-dom';

    // Mock the AuthContext provider
    const mockAuthContext = {
      login: jest.fn(),
      isAuthenticated: false,
      user: null,
      error: null,
      isLoading: false,
    };

    describe('AuthForm', () => {
      test('renders login form correctly', () => {
        render(
          <AuthContext.Provider value={mockAuthContext}>
            <Router><AuthForm /></Router>
          </AuthContext.Provider>
        );
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });

      test('calls login function on submit with correct credentials', async () => {
        render(
          <AuthContext.Provider value={mockAuthContext}>
            <Router><AuthForm /></Router>
          </AuthContext.Provider>
        );

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
          expect(mockAuthContext.login).toHaveBeenCalledWith('test@example.com', 'password123');
        });
      });

      test('displays error message on login failure', async () => {
        const errorAuthContext = { ...mockAuthContext, error: 'Invalid credentials', isLoading: false };
        render(
          <AuthContext.Provider value={errorAuthContext}>
            <Router><AuthForm /></Router>
          </AuthContext.Provider>
        );
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
    ```

#### 2.2.2. E2E / Integration Tests (Conceptual)

*   **Purpose:** To test the entire user flow through the application, from login to performing a complex action like creating a scraper and viewing results.
*   **Tools:** Cypress or Playwright (can also be used for E2E testing).
*   **Setup:** Requires a running backend and frontend application (e.g., via Docker Compose).

#### Running Frontend Tests

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install` (or `docker-compose exec frontend bash` to run inside container).
3.  Run tests:
    ```bash
    npm test
    ```

### 2.3. Performance Tests

*   **Tool:** `Locust`
*   **Purpose:** To simulate a load of concurrent users on the API endpoints to measure response times, throughput, and identify performance bottlenecks.
*   **Coverage:** Key API endpoints (`login`, `list scrapers`, `run scraper`).
*   **Example File:** `backend/tests/performance/test_performance.py` (Locustfile).

#### Running Performance Tests

1.  Ensure all Docker Compose services are running (`docker-compose up -d`).
2.  Navigate to the `backend` directory.
3.  Install Locust (if not already installed): `pip install locust`
4.  Run the Locust master: `locust -f tests/performance/test_performance.py`
5.  Open your browser to `http://localhost:8089` to access the Locust UI.
6.  Configure the number of users, spawn rate, and host (`http://localhost:8000`), then start the test.

## 3. CI/CD Integration

The `.github/workflows/ci-cd.yml` file demonstrates how these tests would be integrated into a GitHub Actions pipeline:

*   **Linting/Formatting:** Ensures code style compliance.
*   **Backend Tests:** Runs `pytest` with coverage report.
*   **Frontend Tests:** Runs `npm test`.
*   **Build & Push Docker Images:** Only if all tests pass.
*   **Deployment:** (Staging/Production, typically after successful tests and image builds).
*   **Post-Deployment Checks:** Could include API health checks or even a basic performance test.

## 4. Code Coverage

*   We aim for **80%+ line coverage** for the backend logic, particularly `app/crud`, `app/core/security`, `app/services`, and core API endpoints.
*   Frontend component coverage is also important to ensure UI stability.
*   Coverage reports help identify untested areas. Use `pytest --cov=app --cov-report=html tests/` to generate an HTML report for backend.