import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css'; // For TailwindCSS

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
```