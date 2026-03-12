```javascript
import React from 'react';
import AuthForm from '../components/AuthForm';
import { Link } from 'react-router-dom';
import './AuthPages.css';

const LoginPage = () => {
  return (
    <div className="auth-page-container">
      <AuthForm type="login" />
      <p className="auth-switch-text">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage;
```