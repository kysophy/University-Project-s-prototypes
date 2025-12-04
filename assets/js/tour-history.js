// ============================================
// TOUR HISTORY PAGE - Logic and UI
// ============================================

// State
let tourHistory = [];
let currentFilter = 'all';
let currentSort = 'recent';

// DOM Elements
const toursContainer = document.getElementById('tours-container');
const emptyState = document.getElementById('empty-state');
const filterStatus = document.getElementById('filter-status');
const sortBy = document.getElementById('sort-by');

// Statistics elements
const totalToursEl = document.getElementById('total-tours');
const totalRestaurantsEl = document.getElementById('total-restaurants');
const totalDishesEl = document.getElementById('total-dishes');
const totalDistanceEl = document.getElementById('total-distance');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../pages/signin.html';
        return;
    }

    loadTourHistory();
    updateStatistics();
});

// Load tour history from localStorage
function loadTourHistory() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showEmptyState();
        return;
    }

    // Get tour history from localStorage
    const userTours = JSON.parse(localStorage.getItem(`tour_history_${currentUser.username}`)) || [];
    tourHistory = userTours;

    if (tourHistory.length === 0) {
        showEmptyState();
    } else {
        displayTours();
    }
}

// Display tours
function displayTours() {
    // Filter tours
    let filteredTours = tourHistory.filter(tour => {
        if (currentFilter === 'all') return true;
        return tour.status === currentFilter;
    });

    // Sort tours
    filteredTours.sort((a, b) => {
        switch (currentSort) {
            case 'recent':
                return new Date(b.date) - new Date(a.date);
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'restaurants':
                return b.stops.length - a.stops.length;
            default:
                return 0;
        }
    });

    // Render
    if (filteredTours.length === 0) {
        showEmptyState();
        return;
    }

    emptyState.style.display = 'none';
    toursContainer.innerHTML = filteredTours.map(tour => createTourCard(tour)).join('');
}

// Create tour card HTML
function createTourCard(tour) {
    const statusLabels = {
        'completed': 'Đã hoàn thành',
        'in-progress': 'Đang thực hiện',
        'cancelled': 'Đã hủy'
    };

    const stopsHTML = tour.stops.map((stop, index) => `
        <div class="tour-stop">
            <div class="stop-number">${index + 1}</div>
            <div class="stop-details">
                <div class="stop-name">${stop.name}</div>
                <div class="stop-dish">${stop.dish}</div>
            </div>
            ${stop.rating ? `
            <div class="stop-rating">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>${stop.rating.toFixed(1)}</span>
            </div>
            ` : ''}
        </div>
    `).join('');

    return `
        <div class="tour-card">
            <div class="tour-header">
                <div class="tour-info">
                    <h3>${tour.name}</h3>
                    <div class="tour-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>${formatDate(tour.date)}</span>
                    </div>
                </div>
                <span class="tour-status ${tour.status}">${statusLabels[tour.status]}</span>
            </div>
            
            <div class="tour-body">
                <div class="tour-stops">
                    ${stopsHTML}
                </div>
                
                <div class="tour-footer">
                    <div class="tour-stats">
                        <div class="tour-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                            <span><strong>${tour.stops.length}</strong> điểm</span>
                        </div>
                        <div class="tour-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span><strong>${tour.duration}</strong></span>
                        </div>
                        <div class="tour-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span><strong>${tour.distance}</strong> km</span>
                        </div>
                    </div>
                    
                    <div class="tour-actions">
                        ${tour.status !== 'cancelled' ? `
                        <button class="btn-action-tour primary" onclick="repeatTour(${tour.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            Lặp lại
                        </button>
                        ` : ''}
                        <button class="btn-action-tour" onclick="shareTour(${tour.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                            </svg>
                            Chia sẻ
                        </button>
                        <button class="btn-action-tour" onclick="deleteTour(${tour.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update statistics
function updateStatistics() {
    const totalTours = tourHistory.length;
    const totalRestaurants = new Set(tourHistory.flatMap(tour => tour.stops.map(s => s.name))).size;
    const totalDishes = tourHistory.reduce((sum, tour) => sum + tour.stops.length, 0);
    const totalDistance = tourHistory.reduce((sum, tour) => sum + parseFloat(tour.distance), 0).toFixed(1);

    totalToursEl.textContent = totalTours;
    totalRestaurantsEl.textContent = totalRestaurants;
    totalDishesEl.textContent = totalDishes;
    totalDistanceEl.textContent = `${totalDistance} km`;
}

// Filter tours
function filterTours() {
    currentFilter = filterStatus.value;
    displayTours();
}

// Sort tours
function sortTours() {
    currentSort = sortBy.value;
    displayTours();
}

// Repeat tour
function repeatTour(tourId) {
    const tour = tourHistory.find(t => t.id === tourId);
    if (!tour) return;

    if (confirm(`Bạn muốn lặp lại tour "${tour.name}"?\n\nTour này sẽ được tạo lại với các điểm dừng tương tự.`)) {
        // Store tour data and redirect to tour designer
        localStorage.setItem('repeat_tour_data', JSON.stringify(tour));
        window.location.href = 'features/tour-designer.html';
    }
}

// Share tour
function shareTour(tourId) {
    const tour = tourHistory.find(t => t.id === tourId);
    if (!tour) return;

    const shareText = `🍜 Tour: ${tour.name}\n📍 ${tour.stops.length} điểm dừng\n⏱️ ${tour.duration}\n\nKhám phá trên Culinary Compass Vietnam!`;

    if (navigator.share) {
        navigator.share({
            title: tour.name,
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Đã sao chép thông tin tour!', 'success');
        });
    }
}

// Delete tour
function deleteTour(tourId) {
    if (!confirm('Bạn có chắc muốn xóa tour này khỏi lịch sử?')) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Remove from tourHistory array
    tourHistory = tourHistory.filter(tour => tour.id !== tourId);

    // Update localStorage
    localStorage.setItem(`tour_history_${currentUser.username}`, JSON.stringify(tourHistory));

    // Refresh display
    loadTourHistory();
    updateStatistics();

    showNotification('Đã xóa tour!', 'success');
}

// Export history
function exportHistory() {
    if (tourHistory.length === 0) {
        showNotification('Không có dữ liệu để xuất!', 'info');
        return;
    }

    // Create CSV content
    let csvContent = 'Tên Tour,Ngày,Trạng thái,Số điểm,Thời gian,Khoảng cách\n';
    
    tourHistory.forEach(tour => {
        const statusLabels = {
            'completed': 'Đã hoàn thành',
            'in-progress': 'Đang thực hiện',
            'cancelled': 'Đã hủy'
        };
        
        csvContent += `"${tour.name}",${formatDate(tour.date)},${statusLabels[tour.status]},${tour.stops.length},${tour.duration},${tour.distance} km\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tour-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Đã xuất báo cáo thành công!', 'success');
}

// Show empty state
function showEmptyState() {
    toursContainer.innerHTML = '';
    emptyState.style.display = 'block';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('vi-VN', options);
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

// Initialize sample tour history if none exists (for demo purposes)
if (isAuthenticated()) {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const existingHistory = localStorage.getItem(`tour_history_${currentUser.username}`);
        if (!existingHistory) {
            const sampleTours = [
                {
                    id: 1,
                    name: 'Southern Street Food Adventure',
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'completed',
                    stops: [
                        { name: 'Phở Lệ', dish: 'Phở bò', rating: 4.5 },
                        { name: 'Bánh Mì Huynh Hoa', dish: 'Bánh mì đặc biệt', rating: 4.7 },
                        { name: 'Cơm Tấm Mộc', dish: 'Cơm tấm sườn bì chả', rating: 4.2 }
                    ],
                    duration: '3 giờ',
                    distance: '5.2'
                },
                {
                    id: 2,
                    name: 'Noodle Lovers Tour',
                    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'completed',
                    stops: [
                        { name: 'Bún Bò Huế Đông Ba', dish: 'Bún bò Huế', rating: 4.4 },
                        { name: 'Hủ Tiếu Nam Vang', dish: 'Hủ tiếu Nam Vang', rating: 4.6 }
                    ],
                    duration: '2 giờ',
                    distance: '3.8'
                },
                {
                    id: 3,
                    name: 'Weekend Food Exploration',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'in-progress',
                    stops: [
                        { name: 'Quán Gỏi Cuốn Sài Gòn', dish: 'Gỏi cuốn', rating: 4.0 },
                        { name: 'Bánh Xèo 46A', dish: 'Bánh xèo', rating: 4.3 }
                    ],
                    duration: '2.5 giờ',
                    distance: '4.1'
                }
            ];
            localStorage.setItem(`tour_history_${currentUser.username}`, JSON.stringify(sampleTours));
        }
    }
}

console.log('🍜 Tour History page initialized successfully!');

