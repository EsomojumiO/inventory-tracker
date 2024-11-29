import React, { createContext, useContext, useState, useCallback } from 'react';
import { CURRENCY, formatNaira } from '../utils/currencyUtils';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [currency] = useState(CURRENCY);

    const formatAmount = useCallback((amount, showSymbol = true, decimals = 2) => {
        return formatNaira(amount, showSymbol, decimals);
    }, []);

    const value = {
        currency,
        formatAmount,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
