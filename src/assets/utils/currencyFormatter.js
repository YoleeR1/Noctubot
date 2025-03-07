/**
 * Formats a number with letter abbreviations (K, M, B, T, etc.)
 * Example: 1234 -> 1.23K, 1234567 -> 1.23M
 * @param {number} num - The number to format
 * @param {number} digits - The number of decimal places to show (default: 2)
 * @returns {string} The formatted number with appropriate suffix
 */
function formatCurrency(num, digits = 2) {
  // Handle edge cases
  if (num === null || num === undefined) return '0';
  if (isNaN(num)) return '0';
  
  // Define suffixes for different scales
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Q'];
  
  // Find the appropriate suffix
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3) || 0;
  
  // Stay within our suffix array bounds
  if (tier >= suffixes.length) {
    return num.toExponential(digits);
  }
  
  // Apply the scale division
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  
  // Format with appropriate precision
  // If the tier is 0 (no suffix), only use digits if there's a decimal portion
  if (tier === 0) {
    if (Number.isInteger(scaled)) {
      return scaled.toString();
    }
    return scaled.toFixed(digits).replace(/\.?0+$/, '');
  }
  
  // For values with suffixes, show the specified number of decimal places
  return scaled.toFixed(digits).replace(/\.?0+$/, '') + suffixes[tier];
}

/**
 * Parses a string with letter abbreviations (K, M, B, T, etc.) into a number
 * Example: "1.23K" -> 1230, "1.23M" -> 1230000
 * @param {string} str - The string to parse
 * @returns {number} The parsed number
 */
function parseCurrency(str) {
  // Handle edge cases
  if (str === null || str === undefined || str === '') return 0;
  
  // Clean the input - remove $ and other non-numeric/non-letter characters
  str = str.toString().trim().replace(/[$,]/g, '');
  
  // Simple case: the string is already just a number
  if (!isNaN(str)) {
    return Number(str);
  }
  
  // Define multipliers for different suffixes
  const multipliers = {
    'k': 1000,
    'K': 1000,
    'm': 1000000,
    'M': 1000000,
    'b': 1000000000,
    'B': 1000000000,
    't': 1000000000000,
    'T': 1000000000000,
    'q': 1000000000000000,
    'Q': 1000000000000000
  };
  
  // Extract the last character to check if it's a suffix
  const lastChar = str.slice(-1);
  
  // If the last character is a recognized suffix
  if (multipliers[lastChar]) {
    // Extract the number part
    const numPart = parseFloat(str.slice(0, -1));
    if (isNaN(numPart)) return 0;
    
    // Multiply by the appropriate factor
    return numPart * multipliers[lastChar];
  }
  
  // If the input doesn't match our expected formats, try parsing it directly
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

module.exports = {
  formatCurrency,
  parseCurrency
};