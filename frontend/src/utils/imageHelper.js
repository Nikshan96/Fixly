/**
 * Convert relative image path to full backend URL
 * @param {string} imagePath - Relative path like "/uploads/filename.jpg" or full URL
 * @returns {string} Full URL to the image on backend server
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a data URL (from FileReader), return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Normalize accidental Windows-style backslashes from persisted paths.
  const normalizedPath = String(imagePath).replace(/\\/g, '/');

  // If it's a relative path, prepend backend URL
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendUrl = apiBaseUrl.replace('/api', ''); // Remove /api suffix
  
  // Ensure path starts with /
  const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  return `${backendUrl}${path}`;
};

export default getImageUrl;
