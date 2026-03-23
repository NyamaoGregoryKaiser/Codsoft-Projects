import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChatList from './components/chat/ChatList';
import ChatRoom from './components/chat/ChatRoom';
import PrivateRoute from './components/common/PrivateRoute';
import Navbar from './components/layout/Navbar';
import './styles/App.css'; // Make sure this path is correct

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar outside Routes so it always shows */}
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><ChatList /></PrivateRoute>} />
          <Route path="/chat/:roomId" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
          {/* Redirect any other path to chat list if authenticated, or login if not */}
          <Route path="*" element={<PrivateRoute><ChatList /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;