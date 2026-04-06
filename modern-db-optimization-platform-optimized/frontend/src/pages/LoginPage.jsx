import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import '../styles/pages.css';

const LoginPage = () => {
  return (
    <div className="page-container auth-page">
      <LoginForm />
    </div>
  );
};

export default LoginPage;