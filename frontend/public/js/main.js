// main.js

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login if not authenticated
    const token = localStorage.getItem('token');
    const isProtectedPage = window.location.pathname !== '/views/login.html';

    if (!token && isProtectedPage) {
        window.location.href = '/views/login.html';
    }
});