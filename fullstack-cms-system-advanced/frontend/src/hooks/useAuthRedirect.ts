import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthRedirectOptions {
  redirectIfAuthenticatedTo?: string;
  redirectIfUnauthenticatedTo?: string;
  allowedRoles?: string[];
  redirectIfUnauthorizedTo?: string;
}

export const useAuthRedirect = (options: AuthRedirectOptions = {}) => {
  const {
    redirectIfAuthenticatedTo,
    redirectIfUnauthenticatedTo,
    allowedRoles,
    redirectIfUnauthorizedTo,
  } = options;

  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      if (redirectIfAuthenticatedTo) {
        navigate(redirectIfAuthenticatedTo, { replace: true });
      }
      if (allowedRoles && !allowedRoles.includes(user!.role.name)) {
        if (redirectIfUnauthorizedTo) {
          navigate(redirectIfUnauthorizedTo, { replace: true });
        } else {
          // Default unauthorized redirect (e.g., dashboard or home)
          navigate('/dashboard', { replace: true });
        }
      }
    } else {
      if (redirectIfUnauthenticatedTo) {
        navigate(redirectIfUnauthenticatedTo, { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate,
      redirectIfAuthenticatedTo, redirectIfUnauthenticatedTo,
      allowedRoles, redirectIfUnauthorizedTo]);
};