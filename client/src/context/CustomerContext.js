import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import config from '../config';

// Create context with meaningful default values
const CustomerContext = createContext({
  customers: [],
  loading: false,
  error: null,
  fetchCustomers: () => Promise.resolve(),
  addCustomer: () => Promise.resolve({ success: false }),
  updateCustomer: () => Promise.resolve({ success: false })
});

export const CustomerProvider = ({ children }) => {
    const [state, setState] = useState({
        customers: [],
        loading: true,
        error: null
    });

    const { token, isAuthenticated } = useAuth();
    const { notify } = useNotification();

    const fetchCustomers = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setState(prev => ({ ...prev, loading: false, customers: [], error: null }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const response = await axios.get(
                `${config.API_BASE_URL}/api/customers`,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }

            const customerData = Array.isArray(response.data) ? response.data :
                               response.data.customers ? response.data.customers :
                               [];

            setState(prev => ({
                ...prev,
                customers: customerData,
                loading: false,
                error: null
            }));

        } catch (error) {
            console.error('Error fetching customers:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error loading customers';
            
            setState(prev => ({
                ...prev,
                customers: [],
                loading: false,
                error: errorMessage
            }));

            notify(errorMessage, 'error');
        }
    }, [token, isAuthenticated, notify]);

    const addCustomer = async (customerData) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await axios.post(
                `${config.API_BASE_URL}/api/customers`,
                customerData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }

            await fetchCustomers();
            notify('Customer added successfully', 'success');
            return { success: true, customer: response.data };

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Error adding customer';
            setState(prev => ({ ...prev, loading: false, error: errorMessage }));
            notify(errorMessage, 'error');
            return { success: false, error: errorMessage };
        }
    };

    const updateCustomer = async (customerId, customerData) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await axios.put(
                `${config.API_BASE_URL}/api/customers/${customerId}`,
                customerData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }

            await fetchCustomers();
            notify('Customer updated successfully', 'success');
            return { success: true, customer: response.data };

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Error updating customer';
            setState(prev => ({ ...prev, loading: false, error: errorMessage }));
            notify(errorMessage, 'error');
            return { success: false, error: errorMessage };
        }
    };

    // Initialize customers when auth state changes
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCustomers();
        } else {
            setState(prev => ({
                ...prev,
                customers: [],
                loading: false,
                error: null
            }));
        }
    }, [isAuthenticated, token, fetchCustomers]);

    const value = {
        ...state,
        fetchCustomers,
        addCustomer,
        updateCustomer
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomer = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomer must be used within a CustomerProvider');
    }
    return context;
};

export default CustomerContext;
