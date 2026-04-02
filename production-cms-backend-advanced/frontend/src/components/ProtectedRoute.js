import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';

const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // Redirect them to the /login page, but save the current URL they tried to go to
        // so we can redirect them back after they log in.
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;