import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Add a console log to track authentication state
    console.log('PrivateRoute - Auth State:', { 
      isAuthenticated, 
      loading, 
      hasUser: !!user, 
      hasToken: !!token,
      path: location.pathname 
    });
  }, [isAuthenticated, loading, user, token, location]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !token) {
    // Store the attempted URL for redirect after login
    console.log('PrivateRoute - Redirecting to login:', { 
      isAuthenticated, 
      hasUser: !!user, 
      hasToken: !!token,
      from: location.pathname 
    });
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default PrivateRoute;
