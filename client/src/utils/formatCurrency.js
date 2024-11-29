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
 * Parse a string with Naira symbol back to number
 * @param {string} str - The string to parse
 * @returns {number} Parsed amount
 */
export const parseNairaString = (str) => {
  if (typeof str === 'number') return str;
  return parseFloat(str.replace(/[₦,]/g, ''));
};
