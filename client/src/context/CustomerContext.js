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

    // Fetch customers
    const fetchCustomers = useCallback(async () => {
        if (!isAuthenticated) {
            console.log('User not authenticated');
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const response = await api.get('/api/customers');
            setState(prev => ({
                ...prev,
                customers: Array.isArray(response.data.data) ? response.data.data : [],
                loading: false
            }));
        } catch (error) {
            console.error('Error fetching customers:', error);
            setState(prev => ({
                ...prev,
                customers: [],
                loading: false,
                error: error.response?.data?.message || 'Error fetching customers'
            }));
            showError(error.response?.data?.message || 'Error fetching customers');
            
            if (error.response?.status === 401) {
                logout();
            }
        }
    }, [api, isAuthenticated, showError, logout]);

    // Create customer
    const createCustomer = useCallback(async (customerData) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const response = await api.post('/api/customers', customerData);
            setState(prev => ({
                ...prev,
                customers: [...prev.customers, response.data.data],
                loading: false
            }));
            return response.data.data;
        } catch (error) {
            setState(prev => ({ ...prev, loading: false, error: error.message }));
            showError(error.response?.data?.message || 'Error creating customer');
            throw error;
        }
    }, [api, showError]);

    // Update customer
    const updateCustomer = useCallback(async (id, customerData) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const response = await api.put(`/api/customers/${id}`, customerData);
            setState(prev => ({
                ...prev,
                customers: prev.customers.map(customer => 
                    customer._id === id ? response.data.data : customer
                ),
                loading: false
            }));
            return response.data.data;
        } catch (error) {
            setState(prev => ({ ...prev, loading: false, error: error.message }));
            showError(error.response?.data?.message || 'Error updating customer');
            throw error;
        }
    }, [api, showError]);

    // Delete customer
    const deleteCustomer = useCallback(async (id) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            await api.delete(`/api/customers/${id}`);
            setState(prev => ({
                ...prev,
                customers: prev.customers.filter(customer => customer._id !== id),
                loading: false
            }));
        } catch (error) {
            setState(prev => ({ ...prev, loading: false, error: error.message }));
            showError(error.response?.data?.message || 'Error deleting customer');
            throw error;
        }
    }, [api, showError]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCustomers();
        }
    }, [isAuthenticated, token, fetchCustomers]);

    const value = {
        ...state,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export default CustomerContext;
