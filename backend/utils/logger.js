/**
 * Simple centralized logger utility
 */
const logger = {
    info: (message, meta = {}) => {
        console.log([INFO]  - , Object.keys(meta).length ? meta : '');
    },
    error: (message, error) => {
        console.error([ERROR]  - , error || '');
    },
    warn: (message, meta = {}) => {
        console.warn([WARN]  - , Object.keys(meta).length ? meta : '');
    }
}
module.exports = logger;
