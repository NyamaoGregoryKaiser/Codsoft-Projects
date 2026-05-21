import React from 'react';
import AuthForm from './AuthForm';

const RegisterPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen-minus-header bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm type="register" />
    </div>
  );
};

export default RegisterPage;