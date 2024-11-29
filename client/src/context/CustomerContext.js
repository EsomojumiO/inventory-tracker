import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import config from '../config';

const CustomerContext = createContext(null);

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token, isAuthenticated } = useAuth();
    const { notify } = useNotification();

    const fetchCustomers = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(
                `${config.apiUrl}/customers`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(response.data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setError(error.message);
            notify('Error fetching customers', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, isAuthenticated, notify]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCustomers();
        } else {
            setCustomers([]);
            setLoading(false);
            setError(null);
        }
    }, [isAuthenticated, token, fetchCustomers]);

    const addCustomer = async (customerData) => {
        if (!token || !isAuthenticated) {
            notify('Authentication required', 'error');
            throw new Error('Authentication required');
        }

        try {
            const response = await axios.post(
                `${config.apiUrl}/customers`,
                customerData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(prev => [...prev, response.data.customer]);
            notify('Customer added successfully', 'success');
            return response.data.customer;
        } catch (error) {
            notify(error.response?.data?.message || 'Error adding customer', 'error');
            throw error;
        }
    };

    const updateCustomer = async (id, customerData) => {
        if (!token || !isAuthenticated) {
            notify('Authentication required', 'error');
            throw new Error('Authentication required');
        }

        try {
            const response = await axios.put(
                `${config.apiUrl}/customers/${id}`,
                customerData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(prev => 
                prev.map(customer => 
                    customer._id === id ? response.data.customer : customer
                )
            );
            notify('Customer updated successfully', 'success');
            return response.data.customer;
        } catch (error) {
            notify(error.response?.data?.message || 'Error updating customer', 'error');
            throw error;
        }
    };

    const deleteCustomer = async (id) => {
        if (!token || !isAuthenticated) {
            notify('Authentication required', 'error');
            throw new Error('Authentication required');
        }

        try {
            await axios.delete(
                `${config.apiUrl}/customers/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomers(prev => prev.filter(customer => customer._id !== id));
            notify('Customer deleted successfully', 'success');
        } catch (error) {
            notify(error.response?.data?.message || 'Error deleting customer', 'error');
            throw error;
        }
    };

    const value = {
        customers,
        loading,
        error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        fetchCustomers
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
