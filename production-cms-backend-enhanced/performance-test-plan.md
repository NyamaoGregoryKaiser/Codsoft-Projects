# Performance Test Plan for CMS System

## 1. Introduction
This document outlines the strategy for performance testing the CMS System. The goal is to identify bottlenecks, evaluate scalability, and ensure the system meets non-functional requirements under various load conditions.

## 2. Scope
The performance testing will focus on critical API endpoints and key user journeys, including:
*   User Authentication (`POST /api/auth/signin`)
*   Content Creation (`POST /api/content`) - for authenticated users
*   Content Retrieval (`GET /api/content/{id}`, `GET /api/content/slug/{slug}`, `GET /api/content`) - public access and paginated lists
*   Category Retrieval (`GET /api/categories`) - public access
*   Content Update (`PUT /api/content/{id}`) - for authenticated users
*   Dashboard Load (`GET /dashboard`) - for authenticated users (Thymeleaf page rendering)

## 3. Tools
*   **Load Generation:** Apache JMeter, k6, or Locust. (JMeter is widely used for Java apps).
*   **Monitoring:** Spring Boot Actuator, Prometheus, Grafana.
*   **Reporting:** JMeter HTML Report Generator, custom dashboards in Grafana.

## 4. Test Scenarios and Workload Model

### Scenario 1: Concurrent Users accessing Public Content
*   **Objective:** Test public content serving capabilities under load.
*   **Endpoint(s):** `GET /api/content`, `GET /api/content/{id}`, `GET /api/content/slug/{slug}`
*   **User Types:** Anonymous/Guest users.
*   **Workload:**
    *   **Ramp-up:** 100 users over 5 minutes.
    *   **Steady State:** 200 concurrent users for 30 minutes.
    *   **Mix:** 70% `GET /api/content` (paginated), 20% `GET /api/content/{id}`, 10% `GET /api/content/slug/{slug}`
*   **Expected Results:**
    *   Response Time: < 500 ms (average)
    *   Throughput: > 1000 requests/second
    *   Error Rate: < 0.1%

### Scenario 2: Authenticated Users performing CRUD Operations
*   **Objective:** Evaluate performance of secured content management APIs.
*   **Endpoint(s):** `POST /api/auth/signin`, `POST /api/content`, `PUT /api/content/{id}`, `DELETE /api/content/{id}`
*   **User Types:** Editors/Admins (requiring prior login).
*   **Workload:**
    *   **Ramp-up:** 20 users over 2 minutes.
    *   **Steady State:** 50 concurrent users for 20 minutes.
    *   **Mix:** 20% `POST /api/auth/signin` (simulated logins), 40% `POST /api/content`, 30% `PUT /api/content/{id}`, 10% `DELETE /api/content/{id}`. (Realistic mix of read/write).
*   **Expected Results:**
    *   Response Time:
        *   Login: < 300 ms
        *   Create/Update: < 800 ms
        *   Delete: < 600 ms
    *   Throughput: > 100 requests/second
    *   Error Rate: < 0.5%

### Scenario 3: UI Dashboard Load
*   **Objective:** Test the performance of rendering server-side rendered (Thymeleaf) pages.
*   **Endpoint(s):** `GET /dashboard`
*   **User Types:** Authenticated users.
*   **Workload:**
    *   **Ramp-up:** 50 users over 3 minutes.
    *   **Steady State:** 100 concurrent users for 15 minutes.
*   **Expected Results:**
    *   Response Time: < 700 ms (average)
    *   Throughput: > 50 requests/second
    *   Error Rate: < 0.1%

## 5. Test Environment
*   Dedicated environment resembling production (e.g., Docker Compose setup with PostgreSQL).
*   Resources: 2 CPU cores, 4GB RAM for application container, 1 CPU core, 2GB RAM for DB container. (Scalability testing will involve increasing these).

## 6. Metrics to Monitor
*   **Application Metrics:** CPU usage, memory usage, garbage collection, thread counts, database connection pool usage (from Spring Boot Actuator).
*   **Database Metrics:** CPU, memory, disk I/O, active connections, slow queries.
*   **Network Metrics:** Latency, bandwidth.
*   **JMeter Metrics:** Response times (average, 90th/95th/99th percentile), throughput, error rate.

## 7. Reporting
A detailed report will be generated after each test run, including:
*   Summary of test objectives and results.
*   Key performance indicators (KPIs) against expected results.
*   Graphs for response times, throughput, error rates, and resource utilization.
*   Identification of bottlenecks and recommendations for improvement.

## 8. Acceptance Criteria
*   All scenarios meet their defined expected results.
*   No significant resource bottlenecks (CPU > 80%, Memory > 80% for sustained periods).
*   System remains stable without crashes or unexpected errors during stress periods.

## 9. Next Steps
*   Setup JMeter test scripts for each scenario.
*   Configure Prometheus/Grafana for monitoring.
*   Execute tests and analyze results.
*   Iterate on performance tuning and re-testing.
```