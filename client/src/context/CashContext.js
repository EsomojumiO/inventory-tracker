import React, { createContext, useContext, useState, useCallback } from 'react';
import { useCurrency } from './CurrencyContext';
import { useAuth } from '../hooks/useAuth';

const CashContext = createContext();

export const CASH_TRANSACTION_TYPES = {
    PAYMENT: 'PAYMENT',
    REFUND: 'REFUND',
    RECEIPT: 'RECEIPT',
    WITHDRAWAL: 'WITHDRAWAL',
    ADJUSTMENT: 'ADJUSTMENT',
};

export const useCash = () => {
    const context = useContext(CashContext);
    if (!context) {
        throw new Error('useCash must be used within a CashProvider');
    }
    return context;
};

export const CashProvider = ({ children }) => {
    const { user } = useAuth();
    const { formatAmount } = useCurrency();
    const [cashTransactions, setCashTransactions] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [lastReconciliation, setLastReconciliation] = useState(null);

    const addTransaction = useCallback((transaction) => {
        const newTransaction = {
            ...transaction,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
        };

        setCashTransactions(prev => [...prev, newTransaction]);
        
        // Update balance based on transaction type
        setCurrentBalance(prev => {
            let change = transaction.amount;
            if ([CASH_TRANSACTION_TYPES.REFUND, CASH_TRANSACTION_TYPES.WITHDRAWAL].includes(transaction.type)) {
                change = -change;
            }
            return prev + change;
        });

        return newTransaction;
    }, [user]);

    const reconcileCash = useCallback((actualAmount, notes) => {
        const systemBalance = currentBalance;
        const discrepancy = actualAmount - systemBalance;
        
        const reconciliation = {
            timestamp: new Date().toISOString(),
            systemBalance,
            actualAmount,
            discrepancy,
            notes,
            userId: user.id,
            userName: user.name,
        };

        if (discrepancy !== 0) {
            addTransaction({
                type: CASH_TRANSACTION_TYPES.ADJUSTMENT,
                amount: discrepancy,
                notes: `Reconciliation adjustment: ${notes}`,
            });
        }

        setLastReconciliation(reconciliation);
        return reconciliation;
    }, [currentBalance, user, addTransaction]);

    const getTransactionsByDateRange = useCallback((startDate, endDate) => {
        return cashTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.timestamp);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [cashTransactions]);

    const getCashSummary = useCallback((startDate, endDate) => {
        const transactions = getTransactionsByDateRange(startDate, endDate);
        
        return transactions.reduce((summary, transaction) => {
            const amount = transaction.amount;
            
            switch (transaction.type) {
                case CASH_TRANSACTION_TYPES.PAYMENT:
                    summary.totalReceived += amount;
                    break;
                case CASH_TRANSACTION_TYPES.REFUND:
                    summary.totalRefunded += amount;
                    break;
                case CASH_TRANSACTION_TYPES.WITHDRAWAL:
                    summary.totalWithdrawn += amount;
                    break;
                case CASH_TRANSACTION_TYPES.ADJUSTMENT:
                    if (amount > 0) {
                        summary.totalAdjustmentsPositive += amount;
                    } else {
                        summary.totalAdjustmentsNegative += Math.abs(amount);
                    }
                    break;
                default:
                    break;
            }
            
            return summary;
        }, {
            totalReceived: 0,
            totalRefunded: 0,
            totalWithdrawn: 0,
            totalAdjustmentsPositive: 0,
            totalAdjustmentsNegative: 0,
            netCashFlow: currentBalance,
        });
    }, [getTransactionsByDateRange, currentBalance]);

    const value = {
        cashTransactions,
        currentBalance,
        lastReconciliation,
        addTransaction,
        reconcileCash,
        getTransactionsByDateRange,
        getCashSummary,
        formatAmount,
    };

    return (
        <CashContext.Provider value={value}>
            {children}
        </CashContext.Provider>
    );
};
