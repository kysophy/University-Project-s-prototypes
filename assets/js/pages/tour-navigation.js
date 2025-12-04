document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map');
    map.setView([10.7725, 106.6980], 13);

    // Define yellow icon
    var yellowIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
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

    const backButton = document.createElement('button');
    backButton.id = 'backButton';
    backButton.innerHTML = '← Back';
    backButton.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 12px 20px;
        background-color: #ffffff;
        color: #333;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
        transition: all 0.3s;
    `;
    backButton.onmouseover = function() {
        this.style.backgroundColor = '#f0f0f0';
    };
    backButton.onmouseout = function() {
        this.style.backgroundColor = '#ffffff';
    };
    backButton.onclick = function() {
        window.location.href = 'tour-designer.html';
    };
    document.body.appendChild(backButton);

    //Import map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    let routeRestaurants = [];
    let restaurantMarkers = [];
    let currentRestaurant = null;
    const ARRIVAL_THRESHOLD = 50; //Check arrival distance

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    function checkArrival() {
        if (!userLat || !userLng || routeRestaurants.length === 0) {
            return;
        }

        for (let restaurant of routeRestaurants) {
            const resLat = restaurant.location?.latitude;
            const resLng = restaurant.location?.longitude;

            if (resLat && resLng) {
                const distance = calculateDistance(userLat, userLng, resLat, resLng);
                
                console.log(`Distance to ${restaurant.name}: ${distance.toFixed(2)}m`);

                if (distance <= ARRIVAL_THRESHOLD) {
                    console.log(`Arrived at ${restaurant.name}!`);
                    
                    // Remove restaurant from route on backend
                    fetch('http://localhost:5000/api/tour/route/remove', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({restaurant_id: restaurant.id})
                    })
                    .then(res => res.json())
                    .then(data => {
                        console.log('Restaurant removed from route:', data);
                        
                        alert(`Bạn đã đến ${restaurant.name}!`);
                        
                        navigationInRoute();
                    })
                    .catch(error => {
                        console.error('Error removing restaurant:', error);
                    });
                    
                    break;
                }
            }
        }
    }

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

            setTimeout(() => {
                navigationInRoute();
            }, 500);
        }

        map.setView([userLat, userLng]);
        checkArrival();
    }

    function error(err) {
        if (err.code === 1) {
            alert("Please allow access to your location.");
        } else {
            alert("Cannot get your location.");
        }
    }

    function updateArrivalButton() {
        let arrivalBtn = document.getElementById('arrivalButton');
        
        if (!arrivalBtn) {
            // Create button
            arrivalBtn = document.createElement('button');
            arrivalBtn.id = 'arrivalButton';
            arrivalBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 30px;
                background: linear-gradient(135deg, #EA580C, #DC2626);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
                z-index: 1000;
                transition: all 0.3s;
            `;
            arrivalBtn.onmouseover = function() {
                this.style.transform = 'translateX(-50%) translateY(-2px)';
                this.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.4)';
            };
            arrivalBtn.onmouseout = function() {
                this.style.transform = 'translateX(-50%)';
                this.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.3)';
            };
            document.body.appendChild(arrivalBtn);
        }

        // Update button text and visibility
        if (currentRestaurant) {
            arrivalBtn.textContent = `Arrived at ${currentRestaurant.name}`;
            arrivalBtn.style.display = 'block';
            arrivalBtn.onclick = () => confirmArrival();
        } else {
            arrivalBtn.style.display = 'none';
        }
    }

    function confirmArrival() {
        if (!currentRestaurant) return;

        const restaurantName = currentRestaurant.name;
        
        fetch('http://localhost:5000/api/tour/route/remove', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({restaurant_id: currentRestaurant.id})
        })
        .then(res => res.json())
        .then(data => {
            console.log('Restaurant removed from route:', data);
            
            // Reload the route
            navigationInRoute();
        })
        .catch(error => {
            console.error('Error removing restaurant:', error);
            alert('Error updating route. Please try again.');
        });
    }

    function navigationInRoute() {
        if (!userLat || !userLng) {
            console.error('User location not available yet');
            return;
        }

        console.log('Fetching route with coordinates:', userLat, userLng);

        fetch('http://localhost:5000/api/tour/route/get')
        .then(res => res.json())
        .then(data => {
            console.log('Route data received:', data);
            
            restaurantMarkers.forEach(m => map.removeLayer(m));
            restaurantMarkers = [];
            
            routeRestaurants = [];
            
            if (!data.route || data.route.length === 0) {
                console.log('No restaurants in route');
                currentRestaurant = null;
                updateArrivalButton();

                if (window.currentRoute) {
                    map.removeControl(window.currentRoute);
                    window.currentRoute = null;
                }
                
                alert('Tour completed! Thank you for participating.');
                setTimeout(() => {
                    window.location.href = 'tour-designer.html';
                }, 2000);
                
                return;
            }
            
            routeRestaurants = data.route;
            
            data.route.forEach((restaurant, index) => {
                const restaurantLat = restaurant.location?.latitude;
                const restaurantLng = restaurant.location?.longitude;
                
                if (restaurantLat && restaurantLng) {
                    const markerIcon = greenIcon;
                    const marker = L.marker([restaurantLat, restaurantLng], { icon: markerIcon })
                        .addTo(map)
                        .bindPopup(`<b>${index + 1}. ${restaurant.name}</b><br>${restaurant.address || 'TP. Hồ Chí Minh'}`);

                    restaurantMarkers.push(marker);
                }
            });
            
            // Clear existing route
            if (window.currentRoute) {
                map.removeControl(window.currentRoute);
            }

            // Get the FIRST restaurant in the route (next destination)
            const firstRestaurant = routeRestaurants[0];
            currentRestaurant = firstRestaurant;
            
            if (firstRestaurant) {
                const lat = firstRestaurant.location?.latitude;
                const lng = firstRestaurant.location?.longitude;
                
                if (lat && lng) {
                    window.currentRoute = L.Routing.control({
                        waypoints: [
                            L.latLng(userLat, userLng),
                            L.latLng(lat, lng)
                        ],
                        routeWhileDragging: false,
                        addWaypoints: false,
                        router: L.Routing.osrmv1({
                            serviceUrl: 'https://router.project-osrm.org/route/v1'
                        })
                    }).addTo(map);
                    
                    console.log(`Route created to: ${firstRestaurant.name} (${routeRestaurants.length} restaurants remaining)`);
                }
            }
            
            updateArrivalButton();
        })
        .catch(error => {
            console.error('Error fetching route:', error);
            alert('Cannot load route. Please try again.');
        });
    }


});

