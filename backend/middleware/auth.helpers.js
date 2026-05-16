// Helper mapping for authentication messages safely abstracted
module.exports = {
    MISSING_TOKEN: 'Unauthorized: No token provided.',
    INVALID_TOKEN: 'Unauthorized: Invalid or expired token.',
    USER_NOT_FOUND: 'Unauthorized: User associated with token missing.'
};
