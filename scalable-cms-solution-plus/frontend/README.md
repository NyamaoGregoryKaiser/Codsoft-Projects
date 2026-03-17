# CMS System Frontend (React)

This is a minimal React frontend application designed to interact with the C++ backend. It demonstrates basic authentication and content listing functionalities.

## Table of Contents
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [API Interaction](#api-interaction)
- [Deployment](#deployment)

## Technologies

*   **Framework**: React.js
*   **Routing**: React Router DOM
*   **HTTP Client**: Axios
*   **State Management**: React Context API (for simple cases) or Redux/Zustand (for complex)
*   **Styling**: Plain CSS or a CSS-in-JS library

## Prerequisites

*   Node.js (LTS version, e.g., 18.x or 20.x)
*   npm or yarn

## Setup & Installation

1.  **Navigate to the frontend directory**:
    ```bash
    cd cms-system/frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure API Base URL**:
    Create a `.env.local` file in the `frontend/` directory:
    ```
    REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
    ```
    Adjust the URL if your backend is running on a different host or port.

## Running the Application

*   **Development mode**:
    ```bash
    npm start
    # or
    yarn start
    ```
    This will start the development server, usually at `http://localhost:3000`. It features hot-reloading.

*   **Production build (locally)**:
    ```bash
    npm run build
    # or
    yarn build
    ```
    This creates a `build` directory with optimized static assets. You can serve this using a static file server like Nginx or Apache.
    If using `docker-compose.yml`, the `frontend` service will automatically build and serve this.

## API Interaction

The frontend interacts with the C++ backend via RESTful API calls. Authentication tokens (JWTs) are stored in local storage and sent with authorized requests.

See `docs/API.md` for backend API endpoint details.

## Deployment

The `Dockerfile` in this directory provides instructions for building a production-ready Docker image of the React application, which can then be deployed to any container orchestration platform (e.g., Kubernetes, AWS ECS, Google Cloud Run).

The `docker-compose.yml` in the root also demonstrates how to run this frontend alongside the backend services.
```