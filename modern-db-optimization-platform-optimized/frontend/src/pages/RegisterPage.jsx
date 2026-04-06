import React from 'react';
import RegisterForm from '../components/Auth/RegisterForm';
import '../styles/pages.css';

const RegisterPage = () => {
  return (
    <div className="page-container auth-page">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;