# Mobile App Frontend Client (React)

This is a minimal React.js client application designed to demonstrate the usage of the Mobile App Backend API. It provides basic user authentication and task management functionalities, consuming the RESTful endpoints exposed by the backend.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Docker Setup](#docker-setup)
4.  [Application Structure](#application-structure)
5.  [Usage](#usage)
6.  [Known Issues / Limitations](#known-issues--limitations)

## 1. Features

*   **User Registration:** Create a new account.
*   **User Login:** Authenticate and obtain a JWT token.
*   **Task List:** View tasks associated with the logged-in user.
*   **Task Create:** Add new tasks.
*   **Task Update:** Mark tasks as complete or update details.
*   **Task Delete:** Remove tasks.
*   **Authentication Context:** Global state management for user authentication.
*   **API Integration:** Uses Axios for making HTTP requests to the backend.

## 2. Technology Stack

*   **Framework:** React.js
*   **Language:** TypeScript
*   **Styling:** Basic CSS (for demonstration, can be replaced with Tailwind CSS, Styled Components, etc.)
*   **HTTP Client:** Axios
*   **Routing:** React Router DOM (if multiple pages were implemented)

## 3. Getting Started

### Prerequisites

*   Node.js (v18+) & npm (or yarn)
*   The [backend server](<path-to-main-repo>/backend/README.md) must be running and accessible.

### Local Development Setup

1.  **Ensure the backend is running:**
    Follow the instructions in the main project `README.md` or `backend/README.md` to start the backend server. It should be accessible at `http://localhost:3000`.

2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Configure environment variables:**
    *   Create a `.env` file by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and set `REACT_APP_API_BASE_URL` to the URL of your running backend API (e.g., `http://localhost:3000/api/v1`).

5.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The application will open in your browser, typically at `http://localhost:3001`.

### Docker Setup (Optional)

You can also run the frontend client using Docker.

1.  **Ensure the backend services (including the database) are running via `docker-compose up -d` in the `backend/` directory.**

2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Build the Docker image for the frontend:**
    ```bash
    docker build -t mobile-app-frontend .
    ```

4.  **Run the frontend container:**
    ```bash
    docker run -p 3001:80 -e REACT_APP_API_BASE_URL=http://host.docker.internal:3000/api/v1 mobile-app-frontend
    ```
    *   **Note:** `host.docker.internal` is a special DNS name that resolves to the internal IP address of the host from within a Docker container. This allows the frontend container to reach the backend service running directly on your host machine's port 3000. If your backend is also in Docker Compose in the *same network*, you would use the service name (e.g., `http://backend:3000/api/v1`).

    The frontend application will be accessible at `http://localhost:3001`.

## 4. Application Structure

```
frontend/
├── public/                     # Public assets
├── src/
│   ├── api/                    # Axios instance and API client for backend
│   │   └── axiosConfig.ts
│   ├── components/             # Reusable UI components (e.g., Button, Input)
│   │   ├── TaskForm.tsx
│   │   └── TaskItem.tsx
│   ├── contexts/               # React Context for global state (e.g., AuthContext)
│   │   └── AuthContext.tsx
│   ├── pages/                  # Main application views
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── types/                  # TypeScript types/interfaces
│   │   └── index.ts
│   ├── utils/                  # Utility functions
│   │   └── auth.ts
│   ├── App.tsx                 # Main application component, sets up routes
│   ├── index.tsx               # Entry point for React app
│   └── index.css               # Global styles
├── .env.example                # Example environment variables
├── Dockerfile                  # Dockerfile for frontend service
├── package.json
└── tsconfig.json
```

## 5. Usage

1.  **Register:** Navigate to the `/register` page and create a new account.
2.  **Login:** Use your new credentials or the seeded users (`user@example.com` / `user123`) to log in.
3.  **Dashboard:** After logging in, you will be redirected to the dashboard, where you can view, create, update, and delete your tasks.
    *   Admin users (`admin@example.com` / `admin123`) will see all tasks, while regular users will only see their own.

## 6. Known Issues / Limitations

*   **Minimal UI/UX:** The focus of this client is to demonstrate API interaction, so the UI/UX is basic and not highly polished. Styling can be significantly improved with a UI framework (e.g., Material UI, Ant Design) or a CSS framework (e.g., Tailwind CSS).
*   **Error Handling:** Basic error display is implemented. A more robust solution would include toast notifications or more detailed user feedback.
*   **Routing:** Simple conditional rendering is used for auth/dashboard. For a larger app, `react-router-dom` would be more extensively utilized.
*   **State Management:** `AuthContext` is used for authentication. For complex applications, Redux, Zustand, or React Query could be considered.