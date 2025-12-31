// Authentication utilities

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.id) {
        // Update navigation based on user role
        const authLinks = document.getElementById('authLinks');
        const userLinks = document.getElementById('userLinks');
        const hostLinks = document.getElementById('hostLinks');
        const adminLinks = document.getElementById('adminLinks');
        
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'block';
        
        if (user.role === 'host') {
            if (hostLinks) hostLinks.style.display = 'block';
        }
        
        if (user.role === 'admin') {
            if (adminLinks) adminLinks.style.display = 'block';
            if (hostLinks) hostLinks.style.display = 'block';
        }
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    } else {
        // Show auth links, hide user links
        const authLinks = document.getElementById('authLinks');
        const userLinks = document.getElementById('userLinks');
        const hostLinks = document.getElementById('hostLinks');
        const adminLinks = document.getElementById('adminLinks');
        
        if (authLinks) authLinks.style.display = 'block';
        if (userLinks) userLinks.style.display = 'none';
        if (hostLinks) hostLinks.style.display = 'none';
        if (adminLinks) adminLinks.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireRole(...roles) {
    if (!requireAuth()) return false;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!roles.includes(user.role)) {
        alert('You do not have permission to access this page');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Initialize auth check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

