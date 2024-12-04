import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import config from '../config';

const CustomerContext = createContext();

export const useCustomer = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomer must be used within a CustomerProvider');
    }
    return context;
};

export const CustomerProvider = ({ children }) => {
    const [state, setState] = useState({
        customers: [],
        loading: false,
        error: null
    });

    const { token, isAuthenticated, logout } = useAuth();
    const { showError } = useNotification();

    // Create axios instance with default config - now memoized
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: config.apiUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add token to requests
        instance.interceptors.request.use(
            (config) => {
                if (!token) {
                    console.log('No token available');
                    return Promise.reject(new Error('Authentication required'));
                }

                config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => {
                console.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Handle response errors
        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
                throw error;
            }
        );

        return instance;
    }, [token, logout]); // Only recreate when token or logout changes

    const fetchCustomers = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setState(prev => ({ 
                ...prev, 
                loading: false, 
                error: 'Authentication required',
                customers: [] 
            }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const response = await api.get('/customers');
            setState(prev => ({
                ...prev,
                customers: response.data,
                loading: false,
                error: null
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                customers: [],
                loading: false,
                error: error.message
            }));
            showError(error.message);
        }
    }, [isAuthenticated, token, api, showError]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCustomers();
        }
    }, [isAuthenticated, token, fetchCustomers]);

    const value = {
        ...state,
        fetchCustomers
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export default CustomerContext;
