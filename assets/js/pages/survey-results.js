// ============================================
// SURVEY RESULTS - Display Restaurants on Map
// ============================================

let map;
let markers = [];
let restaurants = [];
let surveyPreferences = {};

document.addEventListener('DOMContentLoaded', function () {
    // Initialize map
    initializeMap();
    
    // Load survey results from sessionStorage
    loadSurveyResults();
});

function initializeMap() {
    // Center on Ho Chi Minh City
    map = L.map('map').setView([10.7725, 106.6980], 13);
    
    // Add tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

function loadSurveyResults() {
    // Get results from sessionStorage
    const resultsData = sessionStorage.getItem('surveyResults');
    
    if (!resultsData) {
        // No results found - redirect back to survey
        console.error('No survey results found');
        showNoResults('Please complete the survey first');
        setTimeout(() => {
            window.location.href = 'food-survey.html';
        }, 3000);
        return;
    }
    
    try {
        const results = JSON.parse(resultsData);
        surveyPreferences = results.preferences || {};
        restaurants = results.restaurants || [];
        
        console.log('Survey results loaded:', results);
        
        // Validate restaurant data
        restaurants = restaurants.filter(r => {
            // Must have at least name and location
            if (!r.name) {
                console.warn('Restaurant missing name:', r);
                return false;
            }
            if (!r.location || !r.location.latitude || !r.location.longitude) {
                console.warn('Restaurant missing location:', r.name);
                return false;
            }
            return true;
        });
        
        // Check if we have restaurants after filtering
        if (restaurants.length === 0) {
            showNoResults('No valid restaurants found. Try adjusting your survey answers!');
            return;
        }
        
        // Display restaurants
        displayRestaurants();
        
    } catch (error) {
        console.error('Error parsing survey results:', error);
        showNoResults('Error loading results. Please try the survey again.');
        setTimeout(() => {
            sessionStorage.removeItem('surveyResults'); // Clear bad data
            window.location.href = 'food-survey.html';
        }, 3000);
    }
}

function displayRestaurants() {
    // Update count
    const countElement = document.getElementById('restaurantCount');
    countElement.textContent = `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} perfectly matched to your taste!`;
    
    // Display in list
    const listElement = document.getElementById('restaurantsList');
    listElement.innerHTML = '';
    
    restaurants.forEach((restaurant, index) => {
        // Add to list
        const card = createRestaurantCard(restaurant, index + 1);
        listElement.appendChild(card);
        
        // Add marker to map
        addMarkerToMap(restaurant, index + 1);
    });
    
    // Fit map bounds to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function createRestaurantCard(restaurant, number) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.setAttribute('data-restaurant-id', restaurant.id);
    
    // Generate star rating
    const rating = restaurant.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '★'.repeat(fullStars);
    if (hasHalfStar) starsHTML += '☆';
    while (starsHTML.length < 5) starsHTML += '☆';
    
    // Get first 2 tags
    const tags = restaurant.tags ? restaurant.tags.slice(0, 2) : [];
    const tagsHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    card.innerHTML = `
        <div class="restaurant-number">${number}</div>
        <h3 class="restaurant-name">${restaurant.name}</h3>
        <div class="restaurant-rating">
            <span class="rating-stars">${starsHTML}</span>
            <span class="rating-value">${rating.toFixed(1)}</span>
        </div>
        <div class="restaurant-info">
            <div class="info-row">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>${restaurant.address || 'Ho Chi Minh City'}</span>
            </div>
            <div class="info-row">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${restaurant.price_text || formatPrice(restaurant.averagePrice)}</span>
            </div>
            ${restaurant.openHours ? `
            <div class="info-row">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${restaurant.openHours}</span>
            </div>
            ` : ''}
        </div>
        ${tagsHTML ? `<div class="restaurant-tags">${tagsHTML}</div>` : ''}
    `;
    
    // Click to focus on marker
    card.addEventListener('click', () => {
        focusOnRestaurant(restaurant.id);
    });
    
    return card;
}

function addMarkerToMap(restaurant, number) {
    const lat = restaurant.location?.latitude;
    const lng = restaurant.location?.longitude;
    
    if (!lat || !lng) {
        console.warn(`Restaurant ${restaurant.name} has no location data`);
        return;
    }
    
    // Create custom icon with number
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #EA580C, #DC2626);
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            ">${number}</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
    
    // Create marker
    const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
            <div class="marker-popup">
                <div class="marker-popup-title">${number}. ${restaurant.name}</div>
                <div class="marker-popup-info">
                    ${restaurant.rating ? `⭐ ${restaurant.rating.toFixed(1)}` : ''}<br>
                    ${restaurant.price_text || formatPrice(restaurant.averagePrice)}<br>
                    ${restaurant.address || 'Ho Chi Minh City'}
                </div>
            </div>
        `);
    
    // Store marker with restaurant id
    marker.restaurantId = restaurant.id;
    markers.push(marker);
    
    // Click marker to highlight card
    marker.on('click', () => {
        highlightCard(restaurant.id);
    });
}

function formatPrice(price) {
    if (!price) return 'Price not available';
    if (price < 50000) return 'Under 50k VND';
    if (price < 100000) return '50k - 100k VND';
    if (price < 200000) return '100k - 200k VND';
    if (price < 500000) return '200k - 500k VND';
    return 'Over 500k VND';
}

function focusOnRestaurant(restaurantId) {
    // Find and highlight card
    highlightCard(restaurantId);
    
    // Find and open marker popup
    const marker = markers.find(m => m.restaurantId === restaurantId);
    if (marker) {
        map.setView(marker.getLatLng(), 16, { animate: true });
        marker.openPopup();
    }
}

function highlightCard(restaurantId) {
    // Remove active class from all cards
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected card
    const card = document.querySelector(`[data-restaurant-id="${restaurantId}"]`);
    if (card) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function startNavigation() {
    // Show loading indicator
    const btn = event.target.closest('.btn-primary');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg style="animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="60" stroke-dashoffset="15"/>
        </svg>
        Loading...
    `;
    
    // Clear any existing route with timeout
    const clearPromise = fetch('http://localhost:5000/api/tour/route/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
    );
    
    Promise.race([clearPromise, timeoutPromise])
    .then(res => {
        if (!res.ok) throw new Error('Server error');
        return res.json();
    })
    .then(() => {
        // Add all restaurants to the route
        return addRestaurantsToRoute();
    })
    .then(() => {
        // Navigate to tour navigation page
        window.location.href = 'tour-navigation.html';
    })
    .catch(error => {
        console.error('Error starting navigation:', error);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        
        let errorMsg = 'Unable to start navigation. ';
        if (error.message === 'timeout' || error.message.includes('Failed to fetch')) {
            errorMsg += 'Cannot connect to server. Make sure the backend is running (python app.py).';
        } else {
            errorMsg += 'Please try again.';
        }
        
        alert(errorMsg);
    });
}

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

async function addRestaurantsToRoute() {
    // Add restaurants one by one
    for (const restaurant of restaurants) {
        try {
            await fetch('http://localhost:5000/api/tour/route/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurant_id: restaurant.id })
            });
        } catch (error) {
            console.error(`Error adding restaurant ${restaurant.name}:`, error);
        }
    }
}

function showNoResults(message) {
    const noResults = document.getElementById('noResults');
    const infoPanel = document.getElementById('infoPanel');
    
    if (message) {
        noResults.querySelector('p').textContent = message;
    }
    
    noResults.style.display = 'block';
    if (infoPanel) {
        infoPanel.style.display = 'none';
    }
}

function togglePanel() {
    const panel = document.getElementById('infoPanel');
    panel.classList.toggle('collapsed');
}

// Make functions global
window.togglePanel = togglePanel;
window.startNavigation = startNavigation;

console.log('🗺️ Survey Results page initialized!');

