// ============================================
// FAVORITES PAGE - Logic and UI
// ============================================

// State
let favorites = [];
let currentFilter = 'all';
let currentSort = 'recent';

// DOM Elements
const favoritesContainer = document.getElementById('favorites-container');
const emptyState = document.getElementById('empty-state');
const filterType = document.getElementById('filter-type');
const sortBy = document.getElementById('sort-by');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../pages/signin.html';
        return;
    }

    loadFavorites();
});

// Load favorites from localStorage
function loadFavorites() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showEmptyState();
        return;
    }

    // Get favorites from localStorage
    const userFavorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.username}`)) || [];
    favorites = userFavorites;

    if (favorites.length === 0) {
        showEmptyState();
    } else {
        displayFavorites();
    }
}

// Display favorites
function displayFavorites() {
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
    const typeLabel = item.type === 'restaurant' ? 'Nhà hàng' : 'Món ăn';
    
    return `
        <div class="favorite-item" onclick="navigateToItem('${item.type}', ${item.id})">
            <div class="favorite-actions" onclick="event.stopPropagation()">
                <button class="btn-action btn-favorite" onclick="removeFavorite(${item.id}, '${item.type}')" title="Xóa khỏi yêu thích">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                </button>
                <button class="btn-action btn-share" onclick="shareItem('${item.name}')" title="Chia sẻ">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                </button>
            </div>
            
            <img src="${item.image || '../../assets/images/restaurants-img/9.jpg'}" 
                 alt="${item.name}" 
                 class="favorite-image"
                 onerror="this.src='../../assets/images/restaurants-img/9.jpg'">
            
            <div class="favorite-content">
                <span class="favorite-type-badge ${item.type}">${typeLabel}</span>
                <h3 class="favorite-name">${item.name}</h3>
                <p class="favorite-description">${item.description || 'Một trong những địa điểm yêu thích của bạn'}</p>
                
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
                
                <div class="favorite-date">Đã thêm: ${formattedDate}</div>
            </div>
        </div>
    `;
}

// Filter favorites
function filterFavorites() {
    currentFilter = filterType.value;
    displayFavorites();
}

// Sort favorites
function sortFavorites() {
    currentSort = sortBy.value;
    displayFavorites();
}

// Remove from favorites
function removeFavorite(itemId, itemType) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Confirm deletion
    if (!confirm('Bạn có chắc muốn xóa địa điểm này khỏi danh sách yêu thích?')) {
        return;
    }

    // Remove from favorites array
    favorites = favorites.filter(item => !(item.id === itemId && item.type === itemType));

    // Update localStorage
    localStorage.setItem(`favorites_${currentUser.username}`, JSON.stringify(favorites));

    // Refresh display
    loadFavorites();

    // Show notification
    showNotification('Đã xóa khỏi yêu thích!', 'success');
}

// Clear all favorites
function clearAllFavorites() {
    if (favorites.length === 0) {
        showNotification('Danh sách yêu thích đã trống!', 'info');
        return;
    }

    if (!confirm(`Bạn có chắc muốn xóa tất cả ${favorites.length} địa điểm yêu thích?`)) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Clear favorites
    favorites = [];
    localStorage.setItem(`favorites_${currentUser.username}`, JSON.stringify(favorites));

    // Refresh display
    loadFavorites();

    showNotification('Đã xóa tất cả địa điểm yêu thích!', 'success');
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
            showNotification('Đã sao chép link!', 'success');
        });
    }
}

// Show empty state
function showEmptyState() {
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
function isAuthenticated() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Helper: Get current user
function getCurrentUser() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(u => u.username === username);
}

// Handle logout
function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Initialize sample favorites if none exist (for demo purposes)
if (isAuthenticated()) {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const existingFavorites = localStorage.getItem(`favorites_${currentUser.username}`);
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
            localStorage.setItem(`favorites_${currentUser.username}`, JSON.stringify(sampleFavorites));
        }
    }
}

console.log('🍜 Favorites page initialized successfully!');

