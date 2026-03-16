// API Configuration
// Handles environment-specific API base URLs

// API Base URL - dynamic based on environment
// API Base URL - dynamic based on environment
const getBaseUrl = () => {
    return 'https://daricareback.onrender.com';
};

export const API_BASE_URL = getBaseUrl();

export const SOCKET_URL = API_BASE_URL;

/**
 * Helper function to construct full API URLs
 * @param endpoint - API endpoint path (e.g., '/auth/login')
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

    return `${API_BASE_URL}/${cleanEndpoint}`
}

/**
 * Helper function to get upload URLs
 * @param path - Upload path (e.g., '/uploads/image.jpg')
 * @returns Full upload URL
 */
export function getUploadUrl(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    return `${API_BASE_URL}/${cleanPath}`
}
