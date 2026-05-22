```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="homepage-container">
      <header className="hero-section">
        <h1>Welcome to TaskFlow!</h1>
        <p>Your ultimate solution for efficient task management.</p>
        <div className="hero-buttons">
          <Link to="/register" className="btn primary-btn">Get Started</Link>
          <Link to="/login" className="btn secondary-btn">Login</Link>
        </div>
      </header>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Organize Projects</h3>
            <p>Create and manage multiple projects with ease. Keep everything in one place.</p>
          </div>
          <div className="feature-card">
            <h3>Track Tasks</h3>
            <p>Break down your projects into manageable tasks. Set priorities, due dates, and assignees.</p>
          </div>
          <div className="feature-card">
            <h3>Collaborate Seamlessly</h3>
            <p>Assign tasks, add comments, and keep your team aligned on goals.</p>
          </div>
          <div className="feature-card">
            <h3>User Roles & Permissions</h3>
            <p>Flexible access control with Admin and Member roles for secure collaboration.</p>
          </div>
        </div>
      </section>

      <section className="call-to-action-section">
        <h2>Ready to boost your productivity?</h2>
        <Link to="/register" className="btn primary-btn large-btn">Sign Up Now!</Link>
      </section>
    </div>
  );
};

export default HomePage;
```