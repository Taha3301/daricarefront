/**
 * API Configuration
 * Handles environment-specific API base URLs
 */

// Determine if we're in production (GitHub Pages) or development
const isProduction = import.meta.env.PROD

// API Base URL - use proxy in development, direct backend URL in production
export const API_BASE_URL = isProduction
    ? 'https://daricareback.onrender.com'
    : '/api'

export const SOCKET_URL = isProduction
    ? 'https://daricareback.onrender.com'
    : '' // Empty string for io() means current origin

/**
 * Helper function to construct full API URLs
 * @param endpoint - API endpoint path (e.g., '/auth/login')
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

    // In production, append endpoint directly to backend URL
    // In development, use the proxy path
    return isProduction
        ? `${API_BASE_URL}/${cleanEndpoint}`
        : `/api/${cleanEndpoint}`
}

/**
 * Helper function to get upload URLs
 * @param path - Upload path (e.g., '/uploads/image.jpg')
 * @returns Full upload URL
 */
export function getUploadUrl(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    return isProduction
        ? `${API_BASE_URL}/${cleanPath}`
        : `/${cleanPath}`
}
