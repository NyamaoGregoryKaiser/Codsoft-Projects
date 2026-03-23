import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css'; // Global styles
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './auth/AuthContext'; // Import AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();