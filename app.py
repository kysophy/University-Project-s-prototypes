import math
import json
from dataclasses import dataclass, field
from datetime import datetime, time
from typing import List, Optional, Tuple
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

# ----------------------------------------------------------------------------
# CLASSES
# ----------------------------------------------------------------------------

@dataclass
class Coordinates:
    latitude: float
    longitude: float

    def getLatitude(self) -> float:
        return self.latitude

    def getLongitude(self) -> float:
        return self.longitude

class Restaurant:
    def __init__(self, id: int, name: str, rating: float, averagePrice: float,
                 cuisines: List[str], tags: List[str], openHours: str,
                 specialFlags: List[str], location: Coordinates, image_url: str,
                 distance_text: str, price_text: str): # Added UI text
        self.id = id
        self.name = name
        self.rating = rating
        self.averagePrice = averagePrice
        self.cuisines = cuisines
        self.tags = tags
        self.openHours = openHours
        self.specialFlags = specialFlags
        self.location = location
        self.image_url = image_url
        self.distance_text = distance_text
        self.price_text = price_text

    def getId(self) -> int: return self.id
    def getName(self) -> str: return self.name
    def getRating(self) -> float: return self.rating
    def getAveragePrice(self) -> float: return self.averagePrice
    def getCuisines(self) -> List[str]: return self.cuisines
    def getTags(self) -> List[str]: return self.tags
    def getOpenHours(self) -> str: return self.openHours
    def getSpecialFlags(self) -> List[str]: return self.specialFlags
    def getLocation(self) -> Coordinates: return self.location

    # Helper for JSON
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rating": self.rating,
            "averagePrice": self.averagePrice,
            "cuisines": self.cuisines,
            "tags": self.tags,
            "openHours": self.openHours,
            "specialFlags": self.specialFlags,
            "location": {"latitude": self.location.latitude, "longitude": self.location.longitude},
            "image_url": self.image_url,
            "distance_text": self.distance_text,
            "price_text": self.price_text
        }

@dataclass
class SearchQuery:
    userLocation: Coordinates
    queryText: str = ""
    radiusKm: float = 10.0
    priceRange: Optional[str] = None
    sortBy: str = "distance"
    openNow: bool = False
    cuisines: List[str] = field(default_factory=list)
    specialFlags: List[str] = field(default_factory=list)

class LocationService:
    EARTH_RADIUS_KM: float = 6371.0

    def convertToRadians(self, degrees: float) -> float:
        return degrees * math.pi / 180.0

    def calculateDistance(self, userLocation: Coordinates,
                          restaurantLocation: Coordinates) -> float:
        lat1_rad = self.convertToRadians(userLocation.latitude)
        lon1_rad = self.convertToRadians(userLocation.longitude)
        lat2_rad = self.convertToRadians(restaurantLocation.latitude)
        lon2_rad = self.convertToRadians(restaurantLocation.longitude)
        d_lon = lon2_rad - lon1_rad
        d_lat = lat2_rad - lat1_rad
        a = (math.sin(d_lat / 2)**2) + \
            (math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(d_lon / 2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = self.EARTH_RADIUS_KM * c
        return distance

class HoursChecker:
    def __init__(self, simulation_time: Optional[time] = None):
        self._simulation_time = simulation_time

    def _getCurrentTime(self) -> time:
        if self._simulation_time:
            return self._simulation_time
        return datetime.now().time()

    def isOpen(self, openHours: str) -> Tuple[bool, str]:
        try:
            open_str, close_str = openHours.split(' - ')
            open_time = time(int(open_str.split(':')[0]), int(open_str.split(':')[1]))
            close_time = time(int(close_str.split(':')[0]), int(close_str.split(':')[1]))
            now = self._getCurrentTime()

            is_open = False
            if open_time < close_time:
                is_open = open_time <= now <= close_time
            else:
                is_open = now >= open_time or now <= close_time
            
            status_text = "Mở cửa" if is_open else "Đã đóng"
            return is_open, status_text
                
        except (ValueError, TypeError):
            return False, "Đã đóng"

# ----------------------------------------------------------------------------
# DATA SOURCE
# ----------------------------------------------------------------------------

def load_data_from_json(json_path: str) -> List[Restaurant]:
    """Loads restaurant data from a JSON file and returns a list of Restaurant objects."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        restaurant_list = []
        for item in data:
            coords = Coordinates(
                latitude=item['location']['latitude'],
                longitude=item['location']['longitude']
            )
            
            res = Restaurant(
                id=item['id'],
                name=item['name'],
                rating=item['rating'],
                averagePrice=item['averagePrice'],
                cuisines=item['cuisines'],
                tags=item['tags'],
                openHours=item['openHours'],
                specialFlags=item['specialFlags'],
                location=coords,
                image_url=item['image_url'],
                distance_text=item['distance_text'],
                price_text=item['price_text']
            )
            restaurant_list.append(res)
        
        print(f"Successfully loaded {len(restaurant_list)} restaurants from JSON.")
        return restaurant_list
    
    except FileNotFoundError:
        print(f"Error: The data file '{json_path}' was not found.")
        return []
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{json_path}'. Check for syntax errors.")
        return []
    except KeyError as e:
        print(f"Error: Missing key {e} in JSON data.")
        return []

# --- Load the data ---
DATA_SOURCE = load_data_from_json('data/restaurants.json')

# ----------------------------------------------------------------------------
# SERVICE CLASS
# ----------------------------------------------------------------------------

class SearchService:
    def __init__(self, locationService: LocationService, hoursChecker: HoursChecker):
        self.locationService = locationService
        self.hoursChecker = hoursChecker
        self.all_restaurants = DATA_SOURCE

    def _applyFilters(self, restaurants: List[Restaurant], query: SearchQuery) \
                      -> List[Tuple[Restaurant, float, str]]:
        filtered_results = []
        
        for restaurant in restaurants:
            passes_filters = True
            
            # Text Filter
            if query.queryText:
                query_lower = query.queryText.lower()
                in_name = query_lower in restaurant.getName().lower()
                in_tags = any(query_lower in tag.lower() for tag in restaurant.getTags())
                if not (in_name or in_tags):
                    passes_filters = False

            # OpenHours Filter
            is_open, open_status_text = self.hoursChecker.isOpen(restaurant.getOpenHours())
            if query.openNow and not is_open:
                passes_filters = False
                
            # Cuisine Filter
            if query.cuisines:
                if not any(c in restaurant.getCuisines() for c in query.cuisines):
                    passes_filters = False

            # --- ADDED: Special Requirements Filter ---
            if query.specialFlags:
                if not any(f in restaurant.getSpecialFlags() for f in query.specialFlags):
                    passes_filters = False

            # --- ADDED: Price Filter ---
            price = restaurant.getAveragePrice()
            if query.priceRange == "low" and price >= 25000:
                passes_filters = False
            elif query.priceRange == "mid" and (price < 25000 or price > 50000):
                passes_filters = False
            elif query.priceRange == "high" and price <= 50000:
                passes_filters = False

            # Distance Filter
            distance = self.locationService.calculateDistance(
                query.userLocation, restaurant.getLocation()
            )
            # Use the radiusKm from the query
            if query.radiusKm and distance > query.radiusKm:
                passes_filters = False

            if passes_filters:
                # Store with distance and open status
                filtered_results.append((restaurant, distance, open_status_text))
                
        return filtered_results

    def _sortResults(self, results: List[Tuple[Restaurant, float, str]],
                     sortBy: str) -> List[Tuple[Restaurant, float, str]]:
        if sortBy == "rating":
            results.sort(key=lambda item: item[0].getRating(), reverse=True)
        elif sortBy == "distance":
            results.sort(key=lambda item: item[1])
        return results

    def filterRestaurants(self, searchQuery: SearchQuery) -> List[dict]:
        passing_restaurants = self._applyFilters(self.all_restaurants, searchQuery)
        sorted_restaurants = self._sortResults(passing_restaurants, searchQuery.sortBy)
        
        # Convert to JSON-serializable dictionaries
        final_list = []
        for restaurant, distance, open_status_text in sorted_restaurants:
            res_dict = restaurant.to_dict()
            # Update with dynamic data
            res_dict['calculated_distance_km'] = round(distance, 1)
            res_dict['open_status_text'] = open_status_text
            # Use real distance for display
            res_dict['distance_text'] = f"{round(distance, 1)} km" 
            final_list.append(res_dict)
            
        return final_list

# ----------------------------------------------------------------------------
# FLASK API ENDPOINT
# ----------------------------------------------------------------------------

# Instantiate our services
location_service = LocationService()
hours_checker = HoursChecker() 
search_service = SearchService(location_service, hours_checker)

# Create the Flask app
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

@app.route("/", methods=['GET'])
def home():
    # This tells Flask to look in the "templates/" folder for "index.html"
    return render_template("index.html")

# Define the API endpoint for searching
@app.route("/api/search", methods=['POST'])
def handle_search():
    data = request.json
    
    # Default User Location (Ben Thanh Market)
    user_location = Coordinates(
        latitude=data.get('userLatitude', 10.7725),
        longitude=data.get('userLongitude', 106.6980)
    )
    
    query = SearchQuery(
        userLocation=user_location,
        queryText=data.get('queryText', ''),
        openNow=data.get('openNow', False),
        priceRange=data.get('priceRange'),
        cuisines=data.get('cuisines', []),
        sortBy=data.get('sortBy', 'distance'),
        radiusKm=data.get('radiusKm', 10.0),
        specialFlags=data.get('specialFlags', [])
    )
    
    results = search_service.filterRestaurants(query)
    
    return jsonify(results)

# Health check endpoint
def health_check():
    return jsonify({"status": "Culinary Compass API is running!"})

# Start the Flask server
if __name__ == "__main__":
    app.run(debug=True, port=5000)