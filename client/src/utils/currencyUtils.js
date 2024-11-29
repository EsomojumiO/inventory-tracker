/**
 * Currency utility functions for the RetailMaster application
 * Handles Nigerian Naira (₦) formatting and conversions
 */

/**
 * Format a number to Nigerian Naira currency format
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to include the Naira symbol (default: true)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatNaira = (amount, showSymbol = true, decimals = 2) => {
    if (amount === null || amount === undefined) {
        return showSymbol ? '₦0.00' : '0.00';
    }

    const options = {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true,
    };

    const formattedAmount = Number(amount).toLocaleString('en-NG', options);
    return showSymbol ? `₦${formattedAmount}` : formattedAmount;
};

/**
 * Parse a currency string to number
 * @param {string} currencyString - The currency string to parse
 * @returns {number} Parsed amount
 */
export const parseCurrencyString = (currencyString) => {
    if (!currencyString) return 0;
    return Number(currencyString.replace(/[^0-9.-]+/g, ''));
};

/**
 * Format large numbers in a readable format with K, M, B suffixes
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to include the Naira symbol
 * @returns {string} Formatted amount with suffix
 */
export const formatLargeNumber = (amount, showSymbol = true) => {
    if (amount === null || amount === undefined) {
        return showSymbol ? '₦0' : '0';
    }

    const absAmount = Math.abs(amount);
    let formatted;

    if (absAmount >= 1e9) {
        formatted = `${(amount / 1e9).toFixed(1)}B`;
    } else if (absAmount >= 1e6) {
        formatted = `${(amount / 1e6).toFixed(1)}M`;
    } else if (absAmount >= 1e3) {
        formatted = `${(amount / 1e3).toFixed(1)}K`;
    } else {
        formatted = amount.toString();
    }

    return showSymbol ? `₦${formatted}` : formatted;
};

/**
 * Constants for currency-related values
 */
export const CURRENCY = {
    CODE: 'NGN',
    SYMBOL: '₦',
    NAME: 'Nigerian Naira',
    DECIMAL_PLACES: 2,
    LOCALE: 'en-NG',
};

/**
 * Format amount for display in charts and graphs
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount
 */
export const formatChartValue = (amount) => {
    return formatLargeNumber(amount, true);
};

/**
 * Calculate percentage change between two amounts
 * @param {number} currentAmount - Current amount
 * @param {number} previousAmount - Previous amount
 * @returns {number} Percentage change
 */
export const calculatePercentageChange = (currentAmount, previousAmount) => {
    if (!previousAmount) return 0;
    return ((currentAmount - previousAmount) / previousAmount) * 100;
};

/**
 * Format percentage for display
 * @param {number} percentage - The percentage to format
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
};

/**
 * Validate if a string is a valid currency amount
 * @param {string} amount - The amount to validate
 * @returns {boolean} Whether the amount is valid
 */
export const isValidCurrencyAmount = (amount) => {
    const regex = /^₦?[0-9,]+\.?[0-9]*$/;
    return regex.test(amount);
};
