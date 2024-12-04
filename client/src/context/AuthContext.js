import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import config from '../config';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { showSuccess, showError } = useNotification();

    // Create axios instance
    const api = axios.create({
        baseURL: config.apiUrl,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    useEffect(() => {
        const initAuth = () => {
            const storedToken = localStorage.getItem(config.tokenKey);
            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    
                    if (decoded.exp > currentTime) {
                        setToken(storedToken);
                        setUser(decoded);
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem(config.tokenKey);
                    }
                } catch (error) {
                    localStorage.removeItem(config.tokenKey);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.post('/auth/login', credentials);
            const { token: newToken, user: userData } = response.data;

            if (!newToken) {
                throw new Error('No token received from server');
            }

            const decoded = jwtDecode(newToken);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp <= currentTime) {
                throw new Error('Received expired token from server');
            }

            localStorage.setItem(config.tokenKey, newToken);
            setToken(newToken);
            setUser(userData);
            setIsAuthenticated(true);
            showSuccess('Login successful');

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            setError(message);
            setIsAuthenticated(false);
            setToken(null);
            setUser(null);
            localStorage.removeItem(config.tokenKey);
            showError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem(config.tokenKey);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
    }, []);

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
