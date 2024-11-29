import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import config from '../config/config';
import { useNotification } from './NotificationContext'; 

const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  register: () => {},
  clearError: () => {},
  isAuthenticated: false,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(config.TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { notify } = useNotification();

  const logout = useCallback(() => {
    localStorage.removeItem(config.TOKEN_KEY);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    notify('Logged out successfully', 'success');
  }, [notify]);

  // Token refresh mechanism
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token has expired
          logout();
        }
      } catch (err) {
        console.error('Token decode error:', err);
        logout();
      }
    }
  }, [token, logout]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(config.TOKEN_KEY);
        if (storedToken) {
          // Verify token and get user data
          const response = await fetch(`${config.API_BASE_URL}${config.endpoints.auth.verify}`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            logout();
            notify('Session expired. Please login again.', 'warning');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        logout();
        notify('Authentication error. Please login again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [notify, logout]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}${config.endpoints.auth.login}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(config.TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        notify('Login successful', 'success');
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      notify(err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}${config.endpoints.auth.register}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        notify('Registration successful! Please login.', 'success');
        return { success: true };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      notify(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    login,
    logout,
    register,
    clearError,
    isAuthenticated,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
