```javascript
import React from 'react';
import { useState } from 'react';
import axios from 'axios';


function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/register', { email, password });
      setMessage('Registration successful!');
    } catch (error) {
      setMessage('Registration failed.');
    }
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful!');
    } catch (error) {
      setMessage('Login failed.');
    }
  };

  return (
    <div>
      <h1>Authentication System</h1>
      <form onSubmit={handleRegister}>
        <h2>Register</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Register</button>
      </form>
      <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="submit">Login</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default App;
```