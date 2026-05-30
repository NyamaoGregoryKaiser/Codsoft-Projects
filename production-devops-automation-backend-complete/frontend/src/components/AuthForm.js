```javascript
import React, { useState } from 'react';

function AuthForm({ type, onSubmit, error }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'register') {
      onSubmit({ username, email, password });
    } else {
      onSubmit({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{type === 'register' ? 'Register' : 'Login'}</h2>
      {error && <p className="error-message">{error}</p>}
      {type === 'register' && (
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      )}
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">{type === 'register' ? 'Register' : 'Login'}</button>
    </form>
  );
}

export default AuthForm;
```