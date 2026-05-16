/**
 * Formats a Date object or ISO string into a readable format.
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., 'Jan 10, 2026')
 */
export const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
};
