import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import './App.css'; // App-wide styles

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="App-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
            <Route path="/products/new" element={<PrivateRoute><ProductFormPage /></PrivateRoute>} />
            <Route path="/products/edit/:id" element={<PrivateRoute><ProductFormPage /></PrivateRoute>} />
            {/* Catch-all for unknown routes could go here */}
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
```

```