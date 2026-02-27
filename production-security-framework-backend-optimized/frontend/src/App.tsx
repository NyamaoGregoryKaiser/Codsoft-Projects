```typescript
import React from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import UserProfilePage from './pages/UserProfilePage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import NotFoundPage from './pages/NotFoundPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import UsersManagementPage from './pages/UsersManagementPage';

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Secure Task Manager
          </Link>
          <div>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  Dashboard
                </Link>
                <Link to="/projects" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  Projects
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  Profile
                </Link>
                {user.roles?.includes('admin') && (
                  <Link to="/admin/users" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                    Manage Users
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 ml-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 ml-4">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <ProjectsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <PrivateRoute>
                <ProjectDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:projectId/tasks/:taskId"
            element={
              <PrivateRoute>
                <TaskDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <TasksPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <UserProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManagementPage />
              </AdminRoute>
            }
          />

          <Route path="/" element={user ? <DashboardPage /> : <LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
```