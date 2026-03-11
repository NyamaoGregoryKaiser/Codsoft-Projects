import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store/store';
import { logout } from './store/authSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardListPage from './pages/DashboardListPage';
import DashboardEditorPage from './pages/DashboardEditorPage';
import DataSourceListPage from './pages/DataSourceListPage';
import CreateEditDataSourcePage from './pages/CreateEditDataSourcePage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';

const App: React.FC = () => {
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    // Example for auto-logout if token expires (can be enhanced with refresh tokens)
    const checkTokenExpiration = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Assuming JWT structure, need to decode for expiration time
        // This is a simplistic check, a real app would decode the JWT
        // For now, it relies on server returning 401
        // if (jwtExpired(user.token)) {
        //   dispatch(logout());
        //   toast.error('Session expired. Please log in again.');
        // }
      }
    };
    const interval = setInterval(checkTokenExpiration, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4 mt-16"> {/* Adjust mt-16 based on navbar height */}
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboards" /> : <HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboards" element={<DashboardListPage />} />
            <Route path="/dashboards/:id" element={<DashboardEditorPage />} />
            <Route path="/data-sources" element={<DataSourceListPage />} />
            <Route path="/data-sources/new" element={<CreateEditDataSourcePage />} />
            <Route path="/data-sources/edit/:id" element={<CreateEditDataSourcePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Router>
  );
};

export default App;