import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // This is where Tailwind's output is imported
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './auth/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
```
**`frontend/src/App.js`**
```javascript