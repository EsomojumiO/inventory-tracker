/**
 * Format a number as Nigerian Naira
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₦ symbol (default: true)
 * @returns {string} Formatted amount
 */
export const formatNaira = (amount, showSymbol = true) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (!showSymbol) {
    return formatter.format(amount).replace('₦', '');
  }
  return formatter.format(amount);
};

/**
 * Parse a Naira string back to a number
 * @param {string} str - The string to parse (e.g., "₦1,234.56")
 * @returns {number} The parsed amount
 */
export const parseNairaString = (str) => {
  return Number(str.replace(/[₦,]/g, ''));
};

// Default currency settings
export const DEFAULT_CURRENCY = {
  code: 'NGN',
  symbol: '₦',
  locale: 'en-NG'
};

// Make formatNaira the default currency formatter
export const formatCurrency = formatNaira;
