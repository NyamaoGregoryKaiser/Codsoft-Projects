```javascript
import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);

  const handleLogin = async () => {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setProfile(data.user);
    } else {
      alert("Login Failed");
    }
  };

  const handleProfile = async () => {
    const response = await fetch('/profile', {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setProfile(data);
  }

  return (
    <div>
      <h1>Login</h1>
      <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleLogin}>Login</button>
      {token && <button onClick={handleProfile}>Get Profile</button>}
      {profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}
    </div>
  );
}

export default App;
```