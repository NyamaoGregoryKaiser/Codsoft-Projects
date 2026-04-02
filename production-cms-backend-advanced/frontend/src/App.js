import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ContentList from './pages/ContentList';
import ContentDetail from './pages/ContentDetail';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute'; // Example protected route

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<ContentList />} />
                <Route path="/content/:slug" element={<ContentDetail />} />
                <Route path="/login" element={<LoginPage />} />
                {/* Example of a protected route, e.g., for an admin dashboard or user profile */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <h2>Welcome to your Dashboard! (Protected Content)</h2>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;