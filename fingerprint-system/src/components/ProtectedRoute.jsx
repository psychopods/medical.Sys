import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const RoleBasedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = isAuthenticated ? JSON.parse(isAuthenticated) : null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};