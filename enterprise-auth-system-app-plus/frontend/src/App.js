import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotesListPage from './pages/NotesListPage';
import CreateNotePage from './pages/CreateNotePage';
import EditNotePage from './pages/EditNotePage';
import NoteDetailPage from './pages/NoteDetailPage'; // Assuming you create this
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const isAdmin = user && user.roles.includes('ROLE_ADMIN');

  return (
    <div className="App">
      <Header />
      <main className="App-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Private Routes */}
          <Route path="/" element={<PrivateRoute />}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notes" element={<NotesListPage />} />
            <Route path="notes/create" element={<CreateNotePage />} />
            <Route path="notes/:id" element={<NoteDetailPage />} />
            <Route path="notes/edit/:id" element={<EditNotePage />} />

            {/* Admin Only Routes */}
            {isAdmin && <Route path="admin" element={<AdminPage />} />}
          </Route>

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;