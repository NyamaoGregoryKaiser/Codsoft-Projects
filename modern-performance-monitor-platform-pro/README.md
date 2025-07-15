# Performance Monitoring System

This system monitors the performance of a web application by tracking API request latency and error rates.

## Architecture

* **Backend (C++):**  Uses a simple REST API built with [your chosen C++ web framework, e.g., Drogon].  Stores data in a PostgreSQL database.
* **Frontend (React - example):**  A simple dashboard to visualize performance metrics.  (This would be a separate project integrated with the backend).
* **Database (PostgreSQL):** Stores performance metrics.

## Setup

1. **Prerequisites:**  Docker, PostgreSQL, Node.js, npm.
2. **Clone the repository:** `git clone ...`
3. **Database setup:**  (instructions for creating the database and running migrations)
4. **Backend setup:** `cd backend && make build && make run`
5. **Frontend setup:** `cd frontend && npm install && npm start`


## API Documentation

**(Swagger/OpenAPI specification would go here)**