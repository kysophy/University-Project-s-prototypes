/* ============================================
   USER AUTHENTICATION SYSTEM
   Integrated with Account-Management
   ============================================ */

// Authentication State
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let accessToken = localStorage.getItem('accessToken') || null;

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('navActions')) {
        updateNavigation();
        initializeAuthSystem();
    }
});

// Check if user is logged in (uses accessToken to verify)
function isLoggedIn() {
    return accessToken !== null && currentUser !== null;
}

// Update navigation based on login state
function updateNavigation() {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;
    
    if (isLoggedIn()) {
        // Show user account button with dropdown
        const userInitial = currentUser.username.charAt(0).toUpperCase();
        navActions.innerHTML = `
            <div class="user-menu-container">
                <button class="user-account-btn" onclick="toggleAccountDropdown(event)">
                    <div class="user-avatar-small">
                        <span>${userInitial}</span>
                    </div>
                    <span class="user-name-text">${currentUser.username}</span>
                    <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
                
                <div class="account-dropdown" id="accountDropdown">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar">
                            <span>${userInitial}</span>
                        </div>
                        <div class="dropdown-user-info">
                            <p class="dropdown-username">${currentUser.username}</p>
                            <p class="dropdown-email">${currentUser.email || 'user@example.com'}</p>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="${getBasePath()}pages/profile.html" class="dropdown-item">
                        <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        My Account
                    </a>
                    <a href="#" class="dropdown-item" onclick="viewFavorites(event)">
                        <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        Favorite Restaurants
                    </a>
                    <a href="#" class="dropdown-item" onclick="viewTourHistory(event)">
                        <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Tour History
                    </a>
                    <a href="#" class="dropdown-item" onclick="viewSettings(event)">
                        <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Settings
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" onclick="handleLogout(event)">
                        <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Sign Out
                    </a>
                </div>
            </div>
        `;
    } else {
        // Show login/register buttons - link to actual pages
        const basePath = getBasePath();
        navActions.innerHTML = `
            <a href="#" onclick="storePageAndRedirect('${basePath}pages/signin.html')" class="nav-login">Sign In</a>
            <a href="#" onclick="storePageAndRedirect('${basePath}pages/signup.html')" class="nav-register">Sign Up</a>
        `;
    }
}

// Get base path depending on current page location
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/regions/')) {
        return '../../';
    } else if (path.includes('/pages/features/')) {
        return '../../';
    } else if (path.includes('/pages/')) {
        return '../';
    }
    return '';
}

// Initialize auth system
function initializeAuthSystem() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('accountDropdown');
        const userMenuContainer = document.querySelector('.user-menu-container');
        
        if (dropdown && userMenuContainer && 
            !userMenuContainer.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// Toggle account dropdown
function toggleAccountDropdown(event) {
    event.stopPropagation(); // Prevent event from bubbling up
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function storePageAndRedirect(url) {
    const currentPage = window.location.href;
    sessionStorage.setItem('previousPage', currentPage);
    window.location.href = url;
}

// Handle logout
function handleLogout(event) {
    event.preventDefault();
    
    // Confirm logout
    if (confirm('Are you sure you want to sign out?')) {        
        // Clear localStorage (using Account-Management keys)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        
        accessToken = null;
        currentUser = null;
        
        // Close dropdown
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown) dropdown.classList.remove('active');
        
        // Show notification
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification('Signed out successfully! 👋');
        }
        
        // Redirect to home page
        const basePath = getBasePath();
        window.location.href = basePath + 'index.html';
        
        if (window.logAnalytics) {
            logAnalytics('user_logout', {});
        }
    }
}

// View favorites - Navigate to favorites page
function viewFavorites(event) {
    event.preventDefault();
    const basePath = getBasePath();
    window.location.href = basePath + 'pages/favorites.html';
    if (window.logAnalytics) {
        logAnalytics('view_favorites', {});
    }
}

// View tour history - Navigate to tour history page
function viewTourHistory(event) {
    event.preventDefault();
    const basePath = getBasePath();
    window.location.href = basePath + 'pages/tour-history.html';
    if (window.logAnalytics) {
        logAnalytics('view_tour_history', {});
    }
}

// View settings - Navigate to profile page (settings)
function viewSettings(event) {
    event.preventDefault();
    const basePath = getBasePath();
    window.location.href = basePath + 'pages/profile.html';
    if (window.logAnalytics) {
        logAnalytics('view_settings', {});
    }
}

// Export functions for global access
window.toggleAccountDropdown = toggleAccountDropdown;
window.handleLogout = handleLogout;
window.updateNavigation = updateNavigation;
window.viewFavorites = viewFavorites;
window.viewTourHistory = viewTourHistory;
window.viewSettings = viewSettings;
window.isLoggedIn = isLoggedIn;

console.log('🔐 Authentication system loaded successfully!');

