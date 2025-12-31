// API utility functions

const API_BASE = '';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, finalOptions);
        
        if (response.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }
        
        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Helper functions for common API calls
const api = {
    // Auth
    login: (username, password) => 
        apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }),
    
    register: (userData) =>
        apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
    
    // Users
    getProfile: () => apiRequest('/api/users/profile'),
    updateProfile: (data) => apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    changePassword: (data) => apiRequest('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    // Properties
    getProperties: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiRequest(`/api/properties?${params}`);
    },
    getFeaturedProperties: () => apiRequest('/api/properties/featured'),
    getProperty: (id) => apiRequest(`/api/properties/${id}`),
    createProperty: (data) => apiRequest('/api/properties', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateProperty: (id, data) => apiRequest(`/api/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteProperty: (id) => apiRequest(`/api/properties/${id}`, {
        method: 'DELETE'
    }),
    getMyProperties: () => apiRequest('/api/properties/host/my-properties'),
    
    // Bookings
    createBooking: (data) => apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getMyBookings: () => apiRequest('/api/bookings/my-bookings'),
    getBooking: (id) => apiRequest(`/api/bookings/${id}`),
    updateBookingStatus: (id, status, response) => apiRequest(`/api/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, host_response: response })
    }),
    cancelBooking: (id) => apiRequest(`/api/bookings/${id}/cancel`, {
        method: 'PUT'
    }),
    
    // Reviews
    createReview: (data) => apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getPropertyReviews: (propertyId) => apiRequest(`/api/reviews/property/${propertyId}`),
    
    // Wishlist
    addToWishlist: (propertyId) => apiRequest(`/api/wishlist/${propertyId}`, {
        method: 'POST'
    }),
    removeFromWishlist: (propertyId) => apiRequest(`/api/wishlist/${propertyId}`, {
        method: 'DELETE'
    }),
    getWishlist: () => apiRequest('/api/wishlist'),
    
    // Notifications
    getNotifications: () => apiRequest('/api/notifications'),
    markNotificationRead: (id) => apiRequest(`/api/notifications/${id}/read`, {
        method: 'PUT'
    }),
    markAllNotificationsRead: () => apiRequest('/api/notifications/read-all', {
        method: 'PUT'
    }),
    
    // Admin
    getAdminStats: () => apiRequest('/api/admin/stats'),
    getAllUsers: () => apiRequest('/api/users'),
    updateUserStatus: (id, isActive) => apiRequest(`/api/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
    }),
    deleteUser: (id) => apiRequest(`/api/users/${id}`, {
        method: 'DELETE'
    }),
    getAllProperties: () => apiRequest('/api/admin/properties'),
    getAllBookings: () => apiRequest('/api/bookings/admin/all')
};

