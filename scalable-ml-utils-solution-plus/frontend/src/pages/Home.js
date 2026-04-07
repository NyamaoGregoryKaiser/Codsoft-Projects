```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <header className="hero-section">
        <h1>Welcome to ML Utilities Hub</h1>
        <p className="tagline">Your central platform for managing Machine Learning Models, Datasets, and Inferences.</p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">Login</Link>
        </div>
      </header>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Model Management</h3>
            <p>Register, update, and manage your ML models with versioning and detailed metadata.</p>
          </div>
          <div className="feature-card">
            <h3>Dataset Catalog</h3>
            <p>Organize and track datasets linked to your models, including schema previews.</p>
          </div>
          <div className="feature-card">
            <h3>Inference Simulation & Logging</h3>
            <p>Test model endpoints, simulate inferences, and log all requests for monitoring.</p>
          </div>
          <div className="feature-card">
            <h3>Secure Access</h3>
            <p>Authentication and authorization ensure only authorized users can access and manage resources.</p>
          </div>
        </div>
      </section>

      <section className="call-to-action">
        <h2>Ready to Streamline Your ML Workflow?</h2>
        <p>Join the ML Utilities Hub today and take control of your machine learning assets.</p>
        <Link to="/register" className="btn btn-primary">Register Now</Link>
      </section>
    </div>
  );
};

export default Home;
```