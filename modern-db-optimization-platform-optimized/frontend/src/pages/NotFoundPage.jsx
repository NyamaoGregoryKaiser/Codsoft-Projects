import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page page-container">
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  );
};

export default NotFoundPage;