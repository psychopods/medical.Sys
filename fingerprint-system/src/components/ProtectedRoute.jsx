import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    JSON.parse(userStr);
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const RoleBasedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  // Allow superusers access everywhere by default
  const isSuperUser = user?.role === 'superuser' || user?.role_id === '22222222-2222-4222-8222-222222222221';
  if (allowedRoles && !allowedRoles.includes(user?.role) && !isSuperUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};