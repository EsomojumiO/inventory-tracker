/**
 * Currency configuration and formatting utilities
 */

// Currency configurations
export const CURRENCIES = {
    NGN: {
        code: 'NGN',
        name: 'Nigerian Naira',
        symbol: '₦',
        locale: 'en-NG',
    },
    USD: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        locale: 'en-US',
    },
    ZAR: {
        code: 'ZAR',
        name: 'South African Rand',
        symbol: 'R',
        locale: 'en-ZA',
    },
    GHS: {
        code: 'GHS',
        name: 'Ghanaian Cedi',
        symbol: 'GH₵',
        locale: 'en-GH',
    },
    KES: {
        code: 'KES',
        name: 'Kenyan Shilling',
        symbol: 'KSh',
        locale: 'en-KE',
    }
};

// Default currency
export const DEFAULT_CURRENCY = CURRENCIES.NGN;

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (default: NGN)
 * @param {boolean} showDecimal - Whether to show decimal places (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY.code, showDecimal = true) => {
    const currency = CURRENCIES[currencyCode] || DEFAULT_CURRENCY;
    
    const formatter = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: showDecimal ? 2 : 0,
        maximumFractionDigits: showDecimal ? 2 : 0
    });
    
    return formatter.format(amount);
};

/**
 * Parse a currency string back to a number
 * @param {string} value - The string value to parse
 * @returns {number} Parsed number value
 */
export const parseCurrencyString = (value) => {
    if (typeof value === 'number') return value;
    return Number(value.replace(/[^0-9.-]+/g, ''));
};

/**
 * Get currency symbol
 * @param {string} currencyCode - The currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode = DEFAULT_CURRENCY.code) => {
    const currency = CURRENCIES[currencyCode] || DEFAULT_CURRENCY;
    return currency.symbol;
};

/**
 * Get list of available currencies
 * @returns {Array} Array of currency objects
 */
export const getAvailableCurrencies = () => {
    return Object.values(CURRENCIES).map(currency => ({
        value: currency.code,
        label: `${currency.name} (${currency.symbol})`,
        symbol: currency.symbol
    }));
};
