document.addEventListener('DOMContentLoaded', function () {
    // Handle back button navigation based on region parameter
    const urlParams = new URLSearchParams(window.location.search);
    const region = urlParams.get('region');
    const backHomeBtn = document.getElementById('back-home-btn');
    
    if (backHomeBtn) {
        const regionPages = {
                'hcmc': '../regions/hcmc.html'
            };
            const regionPage = regionPages[region] || '../../index.html';
            backHomeBtn.onclick = function() {
                window.location.href = regionPage;
            };
    }
    
    var map = L.map('map');
    map.setView([10.7725, 106.6980], 13); // Ho Chi Minh City center

    //Import map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    //custom marker's color
    const blueIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const yellowIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    function updateAllMarkersAndButtons() {
        allRestaurants.forEach((restaurant, index) => {
            const card = document.querySelectorAll(".restaurant-card")[index];
            const marker = restaurantMarkers[index];
            const isInRoute = routeRestaurants.has(restaurant.id);
            
            if (card) {
                const addButton = card.querySelector("button");
                if (addButton) {
                    if (isInRoute) {
                        addButton.textContent = "Remove from route";
                        addButton.style.background = "#000000";
                    } else {
                        addButton.textContent = "➕ Add to route";
                        addButton.style.background = "#0078ff";
                    }
                }
            }
            
            if (marker) {
                marker.setIcon(isInRoute ? greenIcon : redIcon);
            }
        });
    }

    const restaurantMarkers = [];
    let activeMarker = null;
    let allRestaurants = [];
    let routeRestaurants = new Set();
    let currentDetailPanel = null;

    //handle click vào marker
    function handleMarkerClick(marker) {
        L.DomEvent.stopPropagation(event);

        if (activeMarker && activeMarker !== marker) {
            // Only reset to red if NOT in route
            const markerId = allRestaurants.find(r => 
                r.location.latitude === activeMarker.getLatLng().lat && 
                r.location.longitude === activeMarker.getLatLng().lng
            )?.id;
            
            if (markerId && !routeRestaurants.has(markerId)) {
                activeMarker.setIcon(redIcon);
            }
        }

        const clickedMarkerId = allRestaurants.find(r => 
            r.location.latitude === marker.getLatLng().lat && 
            r.location.longitude === marker.getLatLng().lng
        )?.id;
        
        if (clickedMarkerId && !routeRestaurants.has(clickedMarkerId)) {
            marker.setIcon(blueIcon);
        }
        
        activeMarker = marker;
    }

    map.on('click', function() {
        if (activeMarker) {
            // Only reset to red if NOT in route
            const markerId = allRestaurants.find(r => 
                r.location.latitude === activeMarker.getLatLng().lat && 
                r.location.longitude === activeMarker.getLatLng().lng
            )?.id;
            
            if (markerId && !routeRestaurants.has(markerId)) {
                activeMarker.setIcon(redIcon);
            }
            activeMarker = null;
        }
    });

    //search function using Python backend
    function performSearch(queryText, searchBy = 'all') {
        const searchPayload = {
            queryText: queryText,
            searchBy: searchBy
        };

        return fetch('http://localhost:5000/api/tour/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchPayload)
        })
        .then(res => res.json())
        .then(data => {
            filterDisplayResults(data.results);
            return data;
        })
        .catch(error => {
            console.error("Search error:", error);
        });
    }

    //filter and display search results
    function filterDisplayResults(searchResults) {
        const resultIds = new Set(searchResults.map(r => r.id));
        const restaurantCount = document.querySelector("#restaurant-count");
        let visibleCount = 0;

        allRestaurants.forEach((restaurant, index) => {
            const card = document.querySelectorAll(".restaurant-card")[index];
            const marker = restaurantMarkers[index];
            
            const isMatch = resultIds.has(restaurant.id);
            
            if (card) {
                card.style.display = isMatch ? 'block' : 'none';
                if (isMatch) visibleCount++;
            }
            
            if (marker) {
                marker.setOpacity(isMatch ? 1 : 0.3);
            }
        });
        
        if (restaurantCount) {
            restaurantCount.textContent = `${visibleCount} restaurants`;
        }
    }

    function updateButtonVisibility() {
        const buttonsContainer = document.querySelector(".buttons-in-route");
        
        if (!buttonsContainer) {
            return;
        }
        
        if (routeRestaurants.size === 0) {
            buttonsContainer.classList.remove('show');
            setTimeout(() => {
                buttonsContainer.style.display = 'none';
            }, 300);
        } else {
            buttonsContainer.style.display = 'flex';
            setTimeout(() => {
                buttonsContainer.classList.add('show');
            }, 10);
        }
    }

    function handleRouteButtons() {
        const buttonsContainer = document.querySelector(".buttons-in-route");
        const deleteAllBtn = document.querySelector('.deleteAll');
        const confirmBtn = document.querySelector('.confirm');
        
        if (!buttonsContainer || !deleteAllBtn || !confirmBtn) {
            console.error('Buttons or container not found');
            return;
        }
        
        updateButtonVisibility();

        const newDeleteBtn = deleteAllBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        deleteAllBtn.parentNode.replaceChild(newDeleteBtn, deleteAllBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newDeleteBtn.addEventListener('click', () => {
            if (window.confirm('Are you sure you want to remove all restaurants from the route?')) {
                fetch('http://localhost:5000/api/tour/route/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(res => res.json())
                .then(data => {
                    routeRestaurants.clear();
                    updateAllMarkersAndButtons();
                    updateButtonVisibility();
                    showRoute();
                    console.log('Route cleared:', data);
                })
                .catch(error => {
                    console.error('Error clearing route:', error);
                    alert('Error clearing route!');
                });
            }
        });

        newConfirmBtn.addEventListener('click', () => {
            if (routeRestaurants.size === 0) {
                alert('Please add at least one restaurant to the route!');
                return;
            }
            window.location.href = 'tour-navigation.html';
        });
    }

    function showRoute() {
        fetch('http://localhost:5000/api/tour/route/get')
        .then(res => res.json())
        .then(data => {
            const routeList = document.querySelector('.route-list');
            
            if (!routeList) {
                console.error('Route list element not found');
                return;
            }
            
            // Clear existing route items
            routeList.innerHTML = '';
            
            if (data.count === 0) {
                routeList.innerHTML = '<p class="empty-route"></p>';
                updateButtonVisibility();
                return;
            }

            routeRestaurants.clear();
            data.route.forEach(restaurant => {
                routeRestaurants.add(restaurant.id);
            });
            
            // Create list items for each restaurant in route
            data.route.forEach((restaurant, index) => {
                const routeItem = document.createElement('div');
                routeItem.classList.add('route-item');
                
                routeItem.innerHTML = `
                    <div class="route-number">${index + 1}</div>
                    <span class="route-info"> ${restaurant.name} </span>
                `;
                
                routeList.appendChild(routeItem);
            });

            updateAllMarkersAndButtons();
            handleRouteButtons();
        })
        .catch(error => {
            console.error('Error fetching route:', error);
        });
    }

    function createDetailPanel(restaurant) {
        const r = restaurant;
        const cuisinesText = Array.isArray(r.cuisines) ? r.cuisines.join(", ") : r.cuisines;
        
        const detailInfo = document.createElement("div");
        detailInfo.classList.add("detail-panel");
        detailInfo.innerHTML = `
            <button class="close-detail">✕</button>
            <div class="detail-content">
                <div class="restaurant-header">
                    <div class="header-top">
                        <div class="restaurant-name">
                            <h3>${r.name}</h3>
                            <div class="rating-category">
                                <div class="rating">
                                    <span class="star">⭐</span>
                                    <span class="rating-value">${r.rating}</span>
                                </div>
                                <span class="separator">·</span>
                                <span>${Array.isArray(r.tags) ? r.tags[0] : r.tags}</span>
                            </div>
                        </div>
                    </div>

                    <div class="status-row">
                        <span class="status-badge status-open">Open</span>
                        <span class="status-hours">${r.openHours}</span>
                        <span class="status-price">${r.price_text}</span>
                    </div>

                    <div class="action-buttons">
                        <button class="action-btn btn-directions">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
                                <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path>
                            </svg>
                            Directions
                        </button>
                        <button class="action-btn btn-call">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            Call
                        </button>
                    </div>
                </div>
                <div class="detail-images">
                    <img src="${r.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${r.name}">
                    <div class="image-counter">1 / 1</div>
                </div>
                <div class="detail-tabs">
                    <button class="tab-btn active" data-tab="overview">Overview</button>
                    <button class="tab-btn" data-tab="reviews">Reviews</button>
                    <button class="tab-btn" data-tab="menu">Must Try</button>
                </div>
                <div class="tab-content active" id="overview">
                    <div class="info-item">
                        <div>
                            <p class="info-label">Address</p>
                            <p class="info-value">${r.address || 'Updating...'}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <p class="info-label">Phone</p>
                            <p class="info-value">${r.phone || '+84 888 888 888'}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <p class="info-label">Opening Hours</p>
                            <p class="info-value">${r.openHours || 'Open now'}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <p class="info-label">Price</p>
                            <p class="info-value">${r.price_text || '50,000 - 200,000 VNĐ'}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <p class="info-label">Cuisine Type</p>
                            <p class="info-value">${cuisinesText}</p>
                        </div>
                    </div>
                </div>
                <div class="tab-content" id="reviews">
                    <p>Reviews will be displayed here</p>
                </div>
                <div class="tab-content" id="menu">
                    <p>Menu will be displayed here</p>
                </div>
            </div>
        `;
        
        // Tab switching
        const tabBtns = detailInfo.querySelectorAll('.tab-btn');
        const tabContents = detailInfo.querySelectorAll('.tab-content');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                detailInfo.querySelector(`#${btn.dataset.tab}`).classList.add('active');
            });
        });

        const directionsBtn = detailInfo.querySelector('.btn-directions');
        directionsBtn.addEventListener('click', () => {
            fetch('http://localhost:5000/api/tour/route/clear', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            })
            .then(res => res.json())
            .then(() => {
                //Add to route
                return fetch('http://localhost:5000/api/tour/route/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({restaurant_id: r.id})
                });
            })
            .then(res => res.json())
            .then(data => {
                console.log('Restaurant added to route:', data);
                // Navigate to navigation page
                window.location.href = 'tour-navigation.html';
            })
            .catch(error => {
                console.error('Error setting up navigation:', error);
                alert('Unable to set up directions. Please try again!');
            });
        });
        
        // Close button
        detailInfo.querySelector('.close-detail').addEventListener('click', () => {
            detailInfo.classList.remove('show');
            setTimeout(() => {
                if (detailInfo.parentElement) {
                    detailInfo.parentElement.removeChild(detailInfo);
                }
                if (currentDetailPanel === detailInfo) {
                    currentDetailPanel = null;
                }
            }, 300);
        });
        
        return detailInfo;
    }

    function showDetailPanel(detailInfo) {
        if (currentDetailPanel) {
        const oldPanel = currentDetailPanel;
        oldPanel.classList.remove('show');
        setTimeout(() => {
            if (oldPanel.parentElement) {
                oldPanel.parentElement.removeChild(oldPanel);
            }
        }, 300); 
    }
    
    // Show new panel
    currentDetailPanel = detailInfo;
    document.body.appendChild(detailInfo);
    setTimeout(() => detailInfo.classList.add('show'), 10);
    }

/*////////////////////////////////////////////////////////////////////////////////////////////////////////*/

    //setup search input listener
    const searchInput = document.querySelector('.search-input');
    const restaurantCount = document.querySelector("#restaurant-count");
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query === '') {
                //show all if search is empty
                let visibleCount = 0;
                allRestaurants.forEach((restaurant, index) => {
                    const card = document.querySelectorAll(".restaurant-card")[index];
                    const marker = restaurantMarkers[index];
                    
                    if (card) {
                        card.style.display = 'block';
                        visibleCount++;
                    }
                    if (marker) marker.setOpacity(1);
                });
                
                if (restaurantCount) {
                    restaurantCount.textContent = `${visibleCount} restaurants`;
                }
            } else {
                searchTimeout = setTimeout(() => {
                    performSearch(query, 'all');
                }, 300);
            }
        });
    }

    //fetch data from backend API
    const DATA_URL = 'http://localhost:5000/api/tour/restaurants';
    
    fetch(DATA_URL)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(restaurants => {
        allRestaurants = restaurants;
        const sidebar = document.querySelector(".restaurant");
        const restaurantCount = document.querySelector("#restaurant-count");
        
        // Update the restaurant count immediately
        if (restaurantCount) {
            restaurantCount.textContent = `${restaurants.length} restaurants`;
        }

        //tạo thẻ
        restaurants.forEach(r => {
            const card = document.createElement("div");
            card.classList.add("restaurant-card");
            const tagsHtml = Array.isArray(r.tags) 
                ? r.tags.map(tag => `<span>${tag}</span>`).join("")
                : `<span>${r.tags}</span>`;
            const cuisinesText = Array.isArray(r.cuisines) ? r.cuisines.join(", ") : r.cuisines;
            card.innerHTML = `
                <div class="card-header">
                <h3>${r.name}</h3>
                <span class="tag">${cuisinesText}</span>
                </div>
                <p class="rating"> ⭐ ${r.rating}</p>
                <p class="address">📍 ${r.address || 'Ho Chi Minh City'}</p>
                <div class="tags">
                ${tagsHtml}
                </div>
                <button>➕ Add to route</button>
            `;
            sidebar.appendChild(card);

            const addButton = card.querySelector("button");
            addButton.addEventListener("click", (e) => {
                e.stopPropagation();
                
                const isInRoute = routeRestaurants.has(r.id);
                const endpoint = isInRoute ? '/api/tour/route/remove' : '/api/tour/route/add';
                
                fetch(`http://localhost:5000${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ restaurant_id: r.id })
                })
                .then(res => res.json())
                .then(data => {
                    if (isInRoute) {
                        // Remove from route
                        routeRestaurants.delete(r.id);
                        addButton.textContent = "➕ Add to route";
                        addButton.style.background = "#0078ff";
                        restaurantMarker.setIcon(redIcon);
                    } else {
                        // Add to route
                        routeRestaurants.add(r.id);
                        addButton.textContent = "Remove from route";
                        addButton.style.background = "#000000";
                        restaurantMarker.setIcon(greenIcon);
                    }

                    showRoute();

                    console.log("Route updated:", data);
                });
            });

            //tạo marker
            const coords = [r.location.latitude, r.location.longitude];
            const restaurantMarker = L.marker(coords, { icon: redIcon }, { title: r.name })
            .bindPopup(`
            <b>${r.name}</b><br>
            Rating: ${r.rating} ⭐<br>
            Price: ${r.price_text}<br>
            Hours: ${r.openHours}
            `)
            .addTo(map);

            //thêm marker vào array
            restaurantMarkers.push(restaurantMarker);

            //thêm handler riêng cho marker
            restaurantMarker.on('click', function() {
                handleMarkerClick(this);
                const newDetailPanel = createDetailPanel(r);
                showDetailPanel(newDetailPanel);
            });

            //click vào card trong sidebar
            card.addEventListener("click", () => {
                map.setView(coords, 17);
                restaurantMarker.openPopup();
                handleMarkerClick(restaurantMarker);
                const newDetailPanel = createDetailPanel(r);
                showDetailPanel(newDetailPanel);
            });
            showRoute();
        });
    })
    .catch(error => {
        console.error("Error fetching data:", error);
        alert("Unable to load restaurant data. Please check the server.");
    });

    //GPS
    navigator.geolocation.watchPosition(success, error);
    let marker, circle, zoomed = false;
    let userLat, userLng;

    function success(pos) {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        if (marker) {
            map.removeLayer(marker);
            map.removeLayer(circle);
        }

        marker = L.marker([userLat, userLng], { icon: yellowIcon }).addTo(map);
        circle = L.circle([userLat, userLng], {radius: acc}).addTo(map);

        if (!zoomed) {
            map.fitBounds(circle.getBounds());
            zoomed = true;
        }

        map.setView([userLat, userLng]);
    }

    function error(err) {
        if (err.code === 1) {
            console.log("GPS access denied. Using default location.");
        } else {
            console.log("Cannot get user location.");
        }
    }

    window.addEventListener('load', function() {
        showRoute();
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            showRoute();
        }
    });
});

