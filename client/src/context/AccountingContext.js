import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import config from '../config';

const AccountingContext = createContext();

export const useAccounting = () => {
    const context = useContext(AccountingContext);
    if (!context) {
        throw new Error('useAccounting must be used within an AccountingProvider');
    }
    return context;
};

export const AccountingProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { token } = useAuth();
    const { showSuccess, showError } = useNotification();

    const api = axios.create({
        baseURL: `${config.apiUrl}/accounting`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    // Account Management
    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/accounts');
            setAccounts(response.data.data);
        } catch (error) {
            showError(error.response?.data?.message || 'Error fetching accounts');
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [api, showError]);

    const createAccount = useCallback(async (accountData) => {
        try {
            setLoading(true);
            const response = await api.post('/accounts', accountData);
            setAccounts(prev => [...prev, response.data.data]);
            showSuccess('Account created successfully');
            return response.data.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Error creating account');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, showSuccess, showError]);

    const updateAccount = useCallback(async (id, accountData) => {
        try {
            setLoading(true);
            const response = await api.put(`/accounts/${id}`, accountData);
            setAccounts(prev => prev.map(account => 
                account._id === id ? response.data.data : account
            ));
            showSuccess('Account updated successfully');
            return response.data.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Error updating account');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, showSuccess, showError]);

    // Transaction Management
    const fetchTransactions = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const response = await api.get('/transactions', { params: filters });
            setTransactions(response.data.data);
        } catch (error) {
            showError(error.response?.data?.message || 'Error fetching transactions');
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [api, showError]);

    const createTransaction = useCallback(async (transactionData) => {
        try {
            setLoading(true);
            const response = await api.post('/transactions', transactionData);
            setTransactions(prev => [...prev, response.data.data]);
            showSuccess('Transaction created successfully');
            return response.data.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Error creating transaction');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, showSuccess, showError]);

    const postTransaction = useCallback(async (id) => {
        try {
            setLoading(true);
            const response = await api.post(`/transactions/${id}/post`);
            setTransactions(prev => prev.map(transaction => 
                transaction._id === id ? response.data.data : transaction
            ));
            showSuccess('Transaction posted successfully');
            return response.data.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Error posting transaction');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, showSuccess, showError]);

    const voidTransaction = useCallback(async (id) => {
        try {
            setLoading(true);
            const response = await api.post(`/transactions/${id}/void`);
            setTransactions(prev => prev.map(transaction => 
                transaction._id === id ? response.data.data : transaction
            ));
            showSuccess('Transaction voided successfully');
            return response.data.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Error voiding transaction');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, showSuccess, showError]);

    // Financial Reports
    const generateFinancialReport = useCallback(async (type, startDate, endDate) => {
        try {
            setLoading(true);
            const response = await api.get('/reports/financial', {
                params: { type, startDate, endDate }
            });
            return response.data.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Error generating report');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, showError]);

    const value = {
        accounts,
        transactions,
        loading,
        error,
        fetchAccounts,
        createAccount,
        updateAccount,
        fetchTransactions,
        createTransaction,
        postTransaction,
        voidTransaction,
        generateFinancialReport
    };

    return (
        <AccountingContext.Provider value={value}>
            {children}
        </AccountingContext.Provider>
    );
};

export default AccountingContext;
