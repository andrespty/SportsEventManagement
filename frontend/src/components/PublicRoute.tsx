import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token } = useAuth(); // get current user from context

  if (token) {
    // if logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
