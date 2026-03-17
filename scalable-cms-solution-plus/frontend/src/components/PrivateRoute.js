import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <