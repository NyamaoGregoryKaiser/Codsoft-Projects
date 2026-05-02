```javascript
import React from 'react';

function HomePage() {
  return (
    <div className="container">
      <h1>Welcome to the DevOps Automation System</h1>
      <p>
        This is a full-scale project demonstrating a comprehensive DevOps automation setup
        for a modern full-stack web application. It includes a React frontend,
        Node.js/Express backend, PostgreSQL database, Docker containerization,
        CI/CD pipelines, and various enterprise-grade features.
      </p>
      <h2>Key Features:</h2>
      <ul>
        <li>User Authentication (Register, Login, Profile)</li>
        <li>Product Management (CRUD operations)</li>
        <li>Role-Based Authorization (User, Admin)</li>
        <li>RESTful API with Caching and Rate Limiting</li>
        <li>Database Migrations and Seeding</li>
        <li>Comprehensive Testing (Unit, Integration)</li>
        <li>Dockerized development and production environments</li>
        <li>Automated CI/CD with GitHub Actions</li>
        <li>Structured Logging and Error Handling</li>
      </ul>
      <p>
        Navigate through the application to explore the features. You can register as a new user,
        log in, and manage products. Admins have full control over all products, while regular
        users can manage their own products.
      </p>
    </div>
  );
}

export default HomePage;
```