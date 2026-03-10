import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AccountantProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Allow manager, accountant and admin roles
  if (user.role !== 'manager' && user.role !== 'accountant' && user.role !== 'admin') {
    return <Navigate to="/user" replace />;
  }

  return children;
};

export default AccountantProtectedRoute;
