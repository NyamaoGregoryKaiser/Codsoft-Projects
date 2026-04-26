```javascript
import React, { useState } from 'react';

const AuthForm = ({ type, onSubmit, isLoading, errorMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only for register

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'register') {
      onSubmit(email, password, fullName);
    } else {
      onSubmit(email, password);
    }
  };

  return (
    <div className="card">
      <h2>{type === 'login' ? 'Login' : 'Register'}</h2>
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {type === 'register' && (
          <div className="form-group">
            <label htmlFor="fullName">Full Name (Optional):</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : (type === 'login' ? 'Login' : 'Register')}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
```