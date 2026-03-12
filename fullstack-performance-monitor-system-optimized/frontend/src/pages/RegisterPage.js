```javascript
import React from 'react';
import AuthForm from '../components/AuthForm';
import { Link } from 'react-router-dom';
import './AuthPages.css';

const RegisterPage = () => {
  return (
    <div className="auth-page-container">
      <AuthForm type="register" />
      <p className="auth-switch-text">
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
```