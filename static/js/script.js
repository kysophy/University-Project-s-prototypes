document.addEventListener('DOMContentLoaded', () => {

    // Get references
    const searchInput = document.getElementById('search-input');
    const openNowToggle = document.getElementById('open-now-toggle');
    const sortBySelect = document.getElementById('sort-by-select');
    const radiusSelect = document.getElementById('radius-select');
    const priceSelect = document.getElementById('price-select');
    const cuisineSelect = document.getElementById('cuisine-select');
    const specialSelect = document.getElementById('special-select');
    const restaurantList = document.getElementById('restaurant-list');
    const loadingSpinner = document.getElementById('loading-spinner');

    // API endpoint
    const API_URL = 'http://localhost:5000/api/search';

    // Main function
    async function searchRestaurants() {
        loadingSpinner.style.display = 'block';
        restaurantList.innerHTML = '';

        const queryText = searchInput.value;
        const isOpenNow = openNowToggle.checked;
        const sortBy = sortBySelect.value;
        const radius = radiusSelect.value;
        const priceRange = priceSelect.value;
        const cuisine = cuisineSelect.value;
        const specialFlag = specialSelect.value;

        const userLatitude = 10.7725;
        const userLongitude = 106.6980;

        const searchParams = {
            queryText: queryText,
            openNow: isOpenNow,
            sortBy: sortBy,
            userLatitude: userLatitude,
            userLongitude: userLongitude,
            radiusKm: parseFloat(radius),
            priceRange: priceRange,
            cuisines: cuisine ? [cuisine] : [], 
            specialFlags: specialFlag ? [specialFlag] : [] 
        };

        try {
            // Call the Flask API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchParams)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const restaurants = await response.json();

            // Hide spinner
            loadingSpinner.style.display = 'none';

            // Render results
            renderRestaurantCards(restaurants);

        } catch (error) {
            // Hide spinner and show error
            loadingSpinner.style.display = 'none';
            console.error("Failed to fetch restaurants:", error);
            restaurantList.innerHTML = `<p class="error-message">Failed to load restaurants. Is the backend server running?</p>`;
        }
    }

    // Render the list of cards
    function renderRestaurantCards(restaurants) {
        if (restaurants.length === 0) {
            restaurantList.innerHTML = '<p>No restaurants found matching your criteria.</p>';
            return;
        }

        for (const restaurant of restaurants) {
            // Create the card element
            const card = document.createElement('div');
            card.className = 'restaurant-card';

            const statusClass = restaurant.open_status_text === 'Mở cửa' ? 'status-open' : 'status-closed';

            const tagsHTML = restaurant.tags.map(tag => `<span>${tag}</span>`).join('');

            card.innerHTML = `
                <img src="${restaurant.image_url}" alt="${restaurant.name}">
                <div class="card-info">
                    <h3>${restaurant.name} - ${restaurant.distance_text}</h3>
                    <span class="price-range">${restaurant.price_text}</span>
                </div>
                <div class="card-status">
                    <span class="status-time">${restaurant.openHours}</span>
                    <span class="${statusClass}">${restaurant.open_status_text}</span>
                </div>
                <div class="card-tags">
                    ${tagsHTML}
                </div>
            `;

            restaurantList.appendChild(card);
        }
    }

    // Add event listeners
    
    searchInput.addEventListener('input', debounce(searchRestaurants, 300));
    openNowToggle.addEventListener('change', searchRestaurants);
    sortBySelect.addEventListener('change', searchRestaurants);
    radiusSelect.addEventListener('change', searchRestaurants);
    priceSelect.addEventListener('change', searchRestaurants);
    cuisineSelect.addEventListener('change', searchRestaurants);
    specialSelect.addEventListener('change', searchRestaurants);

    // Initialization
    searchRestaurants();
    
    // Helper function
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
});