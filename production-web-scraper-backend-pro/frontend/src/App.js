```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Scrapers from './pages/Scrapers';
import Tasks from './pages/Tasks';
import Proxies from './pages/Proxies';
import UserAgents from './pages/UserAgents';
import Users from './pages/Users'; // Admin-only route
import NotFound from './pages/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/scrapers" element={<PrivateRoute><Scrapers /></PrivateRoute>} />
              <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
              <Route path="/proxies" element={<PrivateRoute roles={['admin']}><Proxies /></PrivateRoute>} />
              <Route path="/user-agents" element={<PrivateRoute roles={['admin']}><UserAgents /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      </AuthProvider>
    </Router>
  );
}

export default App;
```