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
document.addEventListener('DOMContentLoaded', function () {
    loadTourHistory();
});

// Go back to previous page or home
function goBack() {
    // Try to use stored referrer for this specific page
    const referrer = sessionStorage.getItem('previousPage');
    if (referrer && referrer !== window.location.href) {
        window.location.href = referrer;
    } else {
        // Fallback to browser back button
        window.history.back();
    }
}

// Load tour history from localStorage
function loadTourHistory() {
    // 1. MATCH THE KEY LOGIC FROM NAVIGATION
    // We use the same fallback 'Traveler' so it finds the data you just saved
    const currentUser = localStorage.getItem('currentUser') || 'Traveler';
    const historyKey = `tour_history_${currentUser}`;
    
    console.log("Loading history for user:", currentUser);
    console.log("Reading key:", historyKey);

    // Remove 'const' so we update the global variable defined at the top of the file
    tourHistory = JSON.parse(localStorage.getItem(historyKey)) || []; 
    
    // Create a local reference for the rest of this function to work without changing more code
    const tours = tourHistory; 

    const container = document.getElementById('tours-container');
    const emptyState = document.getElementById('empty-state');

    // 2. TOGGLE EMPTY STATE
    if (tours.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        updateStats([], 0, 0, 0); // Reset stats
        return;
    }

    container.style.display = 'flex';
    emptyState.style.display = 'none';

    // 3. CALCULATE STATS
    let totalRestaurants = 0;
    let totalDishes = 0;
    
    // 4. RENDER TOURS
    container.innerHTML = ''; // Clear current list
    
    tours.forEach(tour => {
        // Update stats
        totalRestaurants += tour.stops.length;
        totalDishes += tour.stops.length; // Assuming 1 dish per stop for now

        // Create HTML for Tour Card
        const card = document.createElement('div');
        card.className = 'tour-card';
        
        // Format Date
        const dateObj = new Date(tour.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });

        // Generate HTML for stops
        let stopsHtml = '';
        tour.stops.forEach((stop, index) => {
            stopsHtml += `
                <div class="tour-stop">
                    <div class="stop-number">${index + 1}</div>
                    <div class="stop-details">
                        <div class="stop-name">${stop.name}</div>
                        <div class="stop-dish">Tried: ${stop.dish || 'Specialty'}</div>
                        <div class="stop-rating">
                            <span>★</span> ${stop.rating || 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="tour-header">
                <div class="tour-info">
                    <h3>${tour.name}</h3>
                    <div class="tour-date">
                        <span>📅</span> ${dateStr}
                    </div>
                </div>
                <div class="tour-status ${tour.status}">
                    ${tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                </div>
            </div>
            
            <div class="tour-body">
                <div class="tour-stops">
                    ${stopsHtml}
                </div>
                
                <div class="tour-footer">
                    <div class="tour-stats">
                        <div class="tour-stat">
                            <strong>${tour.stops.length}</strong> Stops
                        </div>
                        <div class="tour-stat">
                            <strong>${tour.duration || 'Flexible'}</strong> Duration
                        </div>
                    </div>
                    <div class="tour-actions">
                        <button class="btn-action-tour" onclick="deleteTour(${tour.id})">
                            🗑 Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });

    // Update the numbers at the top of the page
    updateStats(tours.length, totalRestaurants, totalDishes);
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
        'completed': 'Completed',
        'in-progress': 'In Progress',
        'cancelled': 'Cancelled'
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
                            <span><strong>${tour.stops.length}</strong> stops</span>
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
                            Repeat
                        </button>
                        ` : ''}
                        <button class="btn-action-tour" onclick="shareTour(${tour.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                            </svg>
                            Share
                        </button>
                        <button class="btn-action-tour" onclick="deleteTour(${tour.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update statistics
function updateStats(count, restaurants, dishes) {
    document.getElementById('total-tours').textContent = count;
    document.getElementById('total-restaurants').textContent = restaurants;
    document.getElementById('total-dishes').textContent = dishes;
    // Distance is hard to calculate without GPS track data, setting to random or 0
    document.getElementById('total-distance').textContent = (restaurants * 1.5).toFixed(1) + " km";
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

    if (confirm(`Do you want to repeat tour "${tour.name}"?\n\nThis tour will be recreated with the same stops.`)) {
        // Store tour data and redirect to tour designer
        localStorage.setItem('repeat_tour_data', JSON.stringify(tour));
        window.location.href = 'features/tour-designer.html';
    }
}

// Share tour
function shareTour(tourId) {
    const tour = tourHistory.find(t => t.id === tourId);
    if (!tour) return;

    const shareText = `🍜 Tour: ${tour.name}\n📍 ${tour.stops.length} stops\n⏱️ ${tour.duration}\n\nExplore on Culinary Compass Vietnam!`;

    if (navigator.share) {
        navigator.share({
            title: tour.name,
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Tour information copied!', 'success');
        });
    }
}

// Delete tour
function deleteTour(tourId) {
    if(!confirm("Are you sure you want to delete this history record?")) return;

    const currentUser = localStorage.getItem('currentUser') || 'Traveler';
    const historyKey = `tour_history_${currentUser}`;
    let tours = JSON.parse(localStorage.getItem(historyKey)) || [];

    // Filter out the deleted tour
    tours = tours.filter(t => t.id !== tourId);

    // Save back to local storage
    localStorage.setItem(historyKey, JSON.stringify(tours));

    // Reload page to see changes
    loadTourHistory();
}

// Export history to CSV
function exportHistory() {
    // 1. Check if there is data
    if (!tourHistory || tourHistory.length === 0) {
        showNotification('No data to export!', 'info');
        return;
    }

    // 2. Calculate Totals for the Report
    let totalRestaurants = 0;
    let totalDishes = 0;
    let totalDistance = 0;

    // Helper to calculate distance consistent with UI
    // If saved distance exists, use it. Otherwise, estimate 1.5km per stop.
    const getDistance = (tour) => {
        let d = parseFloat(tour.distance);
        if (isNaN(d) || d === 0) {
            d = (tour.stops ? tour.stops.length : 0) * 1.5;
        }
        return d;
    };

    tourHistory.forEach(tour => {
        const stopCount = tour.stops ? tour.stops.length : 0;
        totalRestaurants += stopCount;
        totalDishes += stopCount; 
        
        totalDistance += getDistance(tour);
    });

    // 3. Create CSV Content
    // \uFEFF is the BOM to ensure Excel opens Vietnamese characters correctly
    let csvContent = '\uFEFF'; 
    
    // --- SECTION A: SUMMARY STATISTICS ---
    csvContent += `CULINARY COMPASS - TOUR REPORT\n`;
    csvContent += `Generated on,${new Date().toLocaleDateString('vi-VN')}\n\n`;
    
    csvContent += `SUMMARY STATISTICS\n`;
    csvContent += `Total Tours Completed,${tourHistory.length}\n`;
    csvContent += `Total Restaurants Visited,${totalRestaurants}\n`;
    csvContent += `Total Dishes Tried,${totalDishes}\n`;
    // Format to 1 decimal place to match the UI (e.g. "1.5 km")
    csvContent += `Total Distance Traveled,${totalDistance.toFixed(1)} km\n\n`;

    // --- SECTION B: DETAILED LOG ---
    csvContent += `DETAILED TOUR LOG\n`;
    csvContent += `Tour Name,Date,Status,Stops,Duration,Distance (km)\n`;
    
    tourHistory.forEach(tour => {
        const statusLabels = {
            'completed': 'Completed',
            'in-progress': 'In Progress',
            'cancelled': 'Cancelled'
        };
        
        // Handle commas in names by wrapping in quotes
        const safeName = `"${tour.name ? tour.name.replace(/"/g, '""') : 'Unnamed Tour'}"`;
        const dateStr = tour.date ? new Date(tour.date).toLocaleDateString('vi-VN') : 'N/A';
        const status = statusLabels[tour.status] || tour.status;
        const stops = tour.stops ? tour.stops.length : 0;
        const dist = getDistance(tour).toFixed(1); // Use the same consistent calculation
        
        csvContent += `${safeName},${dateStr},${status},${stops},${tour.duration || 'Flexible'},${dist}\n`;
    });

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create a unique filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Travel_Report_${dateStr}.csv`;
    
    // Standard download logic
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('Report exported successfully!', 'success');
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
    const token = localStorage.getItem('accessToken');
    const currentUser = localStorage.getItem('currentUser');
    return token !== null && currentUser !== null;
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
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
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

