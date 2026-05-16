// Placeholder configuration for an Axios or Fetch instance wrapper
export const createHeaders = (token) => {
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: Bearer  } : {})
    };
};

export const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API Request Failed' }));
        throw new Error(error.message || 'Unknown API Error');
    }
    return response.json();
};
