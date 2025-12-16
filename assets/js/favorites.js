// ============================================
// FAVORITES PAGE - Logic and UI
// ============================================

// Go back to previous page or home
function goBack() {
    // Try to use stored referrer for this specific page
    const referrer = sessionStorage.getItem('referrer_favorites');
    if (referrer && referrer !== window.location.href) {
        window.location.href = referrer;
    } else {
        // Fallback to browser back button
        window.history.back();
    }
}

// State
let favorites = [];
let currentFilter = 'all';
let currentSort = 'recent';

// DOM Elements (only get if they exist - for favorites page only)
const favoritesContainer = document.getElementById('favorites-container');
const emptyState = document.getElementById('empty-state');
const filterType = document.getElementById('filter-type');
const sortBy = document.getElementById('sort-by');

// Initialize page (only on favorites page)
document.addEventListener('DOMContentLoaded', () => {
    // Only run favorites page initialization if we're on the favorites page
    if (!favoritesContainer) {
        // Not on favorites page, skip initialization
        return;
    }

    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../pages/signin.html';
        return;
    }
    
    // Store the referrer page for back navigation
    if (document.referrer && !sessionStorage.getItem('previousPage')) {
        sessionStorage.setItem('previousPage', document.referrer);
    }

    loadFavorites();
});

// Load favorites from localStorage
function loadFavorites() {
    // Only run if on favorites page
    if (!favoritesContainer) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
        showEmptyState();
        return;
    }

    // Get username - handle both object and string formats
    const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
    if (!username) {
        showEmptyState();
        return;
    }

    // Get favorites from localStorage
    const userFavorites = JSON.parse(localStorage.getItem(`favorites_${username}`)) || [];
    favorites = userFavorites;

    if (favorites.length === 0) {
        showEmptyState();
    } else {
        displayFavorites();
    }
}

// Display favorites
function displayFavorites() {
    // Only run if on favorites page
    if (!favoritesContainer) return;

    // Filter favorites
    let filteredFavorites = favorites.filter(item => {
        if (currentFilter === 'all') return true;
        return item.type === currentFilter.slice(0, -1); // 'restaurants' -> 'restaurant'
    });

    // Sort favorites
    filteredFavorites.sort((a, b) => {
        switch (currentSort) {
            case 'recent':
                return new Date(b.addedDate) - new Date(a.addedDate);
            case 'oldest':
                return new Date(a.addedDate) - new Date(b.addedDate);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            default:
                return 0;
        }
    });

    // Render
    if (filteredFavorites.length === 0) {
        showEmptyState();
        return;
    }

    emptyState.style.display = 'none';
    favoritesContainer.innerHTML = filteredFavorites.map(item => createFavoriteCard(item)).join('');
}

// Create favorite card HTML
function createFavoriteCard(item) {
    const formattedDate = formatDate(item.addedDate);
    const typeLabel = item.type === 'restaurant' ? 'Restaurant' : 'Dish';
    
    return `
        <div class="favorite-item" onclick="navigateToItem('${item.type}', ${item.id})">
            <div class="favorite-actions" onclick="event.stopPropagation()">
                <button class="btn-action btn-favorite" onclick="removeFavorite(${item.id}, '${item.type}')" title="Remove from favorites">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                </button>
                <button class="btn-action btn-share" onclick="shareItem('${item.name}')" title="Share">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                </button>
            </div>
            
            <div class="favorite-image-wrapper" style="position:relative; width:100%; height:200px; overflow:hidden;">
                ${item.image ? `
                <img src="${item.image}" 
                     alt="${item.name}" 
                     class="favorite-image"
                     style="width:100%; height:100%; object-fit:cover;"
                     onerror="this.onerror=null; this.style.display='none'; const wrapper = this.parentElement; if(wrapper) { wrapper.innerHTML='<div style=\\'width:100%; height:100%; background:linear-gradient(135deg, #FFF7ED, #FFEDD5); display:flex; align-items:center; justify-content:center; font-size:3rem;\\'>🍜</div>'; }">
                ` : `
                <div style="width:100%; height:100%; background:linear-gradient(135deg, #FFF7ED, #FFEDD5); display:flex; align-items:center; justify-content:center; font-size:3rem;">🍜</div>
                `}
            </div>
            
            <div class="favorite-content">
                <span class="favorite-type-badge ${item.type}">${typeLabel}</span>
                <h3 class="favorite-name">${item.name}</h3>
                <p class="favorite-description">${item.description || 'One of your favorite places'}</p>
                
                <div class="favorite-meta">
                    ${item.rating ? `
                    <div class="favorite-rating">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>${item.rating.toFixed(1)}</span>
                    </div>
                    ` : '<div></div>'}
                    
                    ${item.price ? `
                    <div class="favorite-price">${item.price}</div>
                    ` : '<div></div>'}
                </div>
                
                <div class="favorite-date">Added: ${formattedDate}</div>
            </div>
        </div>
    `;
}

// Filter favorites
function filterFavorites() {
    if (!filterType) return;
    currentFilter = filterType.value;
    displayFavorites();
}

// Sort favorites
function sortFavorites() {
    if (!sortBy) return;
    currentSort = sortBy.value;
    displayFavorites();
}

// Check if item is favorited
function isFavorite(itemId, itemType) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    // Get username - handle both object and string formats
    const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
    if (!username) return false;

    const userFavorites = JSON.parse(localStorage.getItem(`favorites_${username}`)) || [];
    return userFavorites.some(item => item.id === itemId && item.type === itemType);
}

// Add to favorites
function addFavorite(itemData) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please sign in to add favorites', 'info');
        return false;
    }

    // Get username - handle both object and string formats
    const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
    if (!username) {
        showNotification('Unable to identify user', 'info');
        return false;
    }

    // Get current favorites
    const userFavorites = JSON.parse(localStorage.getItem(`favorites_${username}`)) || [];

    // Check if already favorited
    if (userFavorites.some(item => item.id === itemData.id && item.type === itemData.type)) {
        showNotification('Already in favorites!', 'info');
        return false;
    }

    // Create favorite item
    const favoriteItem = {
        id: itemData.id,
        name: itemData.name,
        type: itemData.type || 'restaurant',
        rating: itemData.rating,
        price: itemData.price_text || itemData.price,
        description: itemData.description || itemData.address || 'One of your favorite places',
        image: itemData.image_url || itemData.image || '',
        addedDate: new Date().toISOString()
    };

    // Add to favorites
    userFavorites.push(favoriteItem);
    localStorage.setItem(`favorites_${username}`, JSON.stringify(userFavorites));

    showNotification('Added to favorites!', 'success');
    return true;
}

// Toggle favorite (add if not favorited, remove if favorited)
function toggleFavorite(itemData) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please sign in to add favorites', 'info');
        return false;
    }

    const isFavorited = isFavorite(itemData.id, itemData.type || 'restaurant');
    
    if (isFavorited) {
        removeFavorite(itemData.id, itemData.type || 'restaurant', false); // false = no confirm
        return false;
    } else {
        const result = addFavorite(itemData);
        return result;
    }
}

// Remove from favorites
function removeFavorite(itemId, itemType, showConfirm = true) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Get username - handle both object and string formats
    const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
    if (!username) return;

    // Confirm deletion (only if showConfirm is true)
    if (showConfirm && !confirm('Are you sure you want to remove this item from favorites?')) {
        return;
    }

    // Get current favorites
    const userFavorites = JSON.parse(localStorage.getItem(`favorites_${username}`)) || [];

    // Remove from favorites array
    const updatedFavorites = userFavorites.filter(item => !(item.id === itemId && item.type === itemType));

    // Update localStorage
    localStorage.setItem(`favorites_${username}`, JSON.stringify(updatedFavorites));

    // Update local state
    favorites = updatedFavorites;

    // Refresh display if on favorites page
    if (favoritesContainer) {
        displayFavorites();
    }

    // Show notification
    if (showConfirm) {
        showNotification('Removed from favorites!', 'success');
    }
}

// Clear all favorites
function clearAllFavorites() {
    if (favorites.length === 0) {
        showNotification('Favorites list is already empty!', 'info');
        return;
    }

    if (!confirm(`Are you sure you want to remove all ${favorites.length} favorite items?`)) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Get username - handle both object and string formats
    const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
    if (!username) return;

    // Clear favorites
    favorites = [];
    localStorage.setItem(`favorites_${username}`, JSON.stringify(favorites));

    // Refresh display
    loadFavorites();

    showNotification('All favorites removed!', 'success');
}

// Navigate to item detail
function navigateToItem(type, id) {
    if (type === 'restaurant') {
        window.location.href = `features/search.html?restaurant=${id}`;
    } else {
        window.location.href = `features/search.html?dish=${id}`;
    }
}

// Share item
function shareItem(itemName) {
    if (navigator.share) {
        navigator.share({
            title: itemName,
            text: `Hãy thử ${itemName}! Tìm thấy trên Culinary Compass Vietnam.`,
            url: window.location.href
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: Copy to clipboard
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied!', 'success');
        });
    }
}

// Show empty state
function showEmptyState() {
    // Only run if on favorites page
    if (!favoritesContainer || !emptyState) return;
    
    favoritesContainer.innerHTML = '';
    emptyState.style.display = 'block';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Hôm nay';
    } else if (diffDays === 1) {
        return 'Hôm qua';
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} tuần trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.6s;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Helper: Check if user is authenticated
// Supports both old system (isLoggedIn = 'true') and new system (accessToken + currentUser object)
function isAuthenticated() {
    // Check new auth system first (auth.js)
    const accessToken = localStorage.getItem('accessToken');
    const currentUserObj = localStorage.getItem('currentUser');
    
    if (accessToken && currentUserObj) {
        try {
            const user = JSON.parse(currentUserObj);
            if (user && user.username) {
                return true;
            }
        } catch (e) {
            // If parsing fails, fall through to old system check
        }
    }
    
    // Check old auth system (legacy)
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        return true;
    }
    
    return false;
}

// Helper: Get current user
// Supports both old system (username string) and new system (currentUser object)
function getCurrentUser() {
    // Try new auth system first (auth.js)
    const currentUserObj = localStorage.getItem('currentUser');
    if (currentUserObj) {
        try {
            const user = JSON.parse(currentUserObj);
            if (user && user.username) {
                return user;
            }
        } catch (e) {
            // If parsing fails, it might be a string username (old system)
        }
    }
    
    // Fallback to old system (legacy)
    const username = localStorage.getItem('currentUser');
    if (!username) return null;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(u => u.username === username);
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Initialize sample favorites if none exist (for demo purposes)
// Only run this check, don't redirect or access DOM elements
(function() {
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Get username - handle both object and string formats
            const username = typeof currentUser === 'string' ? currentUser : currentUser.username;
            if (!username) return;
            
            const existingFavorites = localStorage.getItem(`favorites_${username}`);
            if (!existingFavorites) {
            const sampleFavorites = [
                {
                    id: 1,
                    name: 'Phở Lệ',
                    type: 'restaurant',
                    rating: 4.5,
                    price: '30k - 60k',
                    description: 'Quán phở nổi tiếng với nước dùng đậm đà',
                    image: '../../assets/images/restaurants-img/phole.png',
                    addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    name: 'Bánh Mì Huynh Hoa',
                    type: 'restaurant',
                    rating: 4.7,
                    price: '20k - 35k',
                    description: 'Bánh mì thơm ngon với nhân đầy đủ',
                    image: '../../assets/images/restaurants-img/banhmi.png',
                    addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 3,
                    name: 'Cơm Tấm Mộc',
                    type: 'restaurant',
                    rating: 4.2,
                    price: '35k - 55k',
                    description: 'Cơm tấm sườn nướng thơm phức',
                    image: '../../assets/images/restaurants-img/comtam.png',
                    addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            localStorage.setItem(`favorites_${username}`, JSON.stringify(sampleFavorites));
            }
        }
    }
})();

console.log('🍜 Favorites page initialized successfully!');

