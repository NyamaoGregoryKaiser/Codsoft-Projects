import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute'; // A component to wrap protected routes

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']}>
            <ProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects/:projectId',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']}>
            <ProjectDetailPage />
          </ProtectedRoute>
        ),
      },
      // Add other routes here, potentially with more specific role-based protection
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;