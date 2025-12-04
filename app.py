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
                 distance_text: str, price_text: str, address: str = ""): # Added address
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
        self.address = address

    def getId(self) -> int: return self.id
    def getName(self) -> str: return self.name
    def getRating(self) -> float: return self.rating
    def getAveragePrice(self) -> float: return self.averagePrice
    def getCuisines(self) -> List[str]: return self.cuisines
    def getTags(self) -> List[str]: return self.tags
    def getOpenHours(self) -> str: return self.openHours
    def getSpecialFlags(self) -> List[str]: return self.specialFlags
    def getLocation(self) -> Coordinates: return self.location
    def getAddress(self) -> str: return self.address

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
            "price_text": self.price_text,
            "address": self.address
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
                price_text=item['price_text'],
                address=item.get('address', '')
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
# TOUR DESIGNER ROUTING HANDLER
# ----------------------------------------------------------------------------

class RoutingHandle:
    def __init__(self):
        self.route_restaurants = []  # List to store restaurant IDs in route
    
    def add_restaurant(self, restaurant_id: int) -> dict:
        """Add a restaurant to the route by ID"""
        if restaurant_id not in self.route_restaurants:
            self.route_restaurants.append(restaurant_id)
            return {"status": "added", "route": self.route_restaurants}
        return {"status": "already_exists", "route": self.route_restaurants}
    
    def remove_restaurant(self, restaurant_id: int) -> dict:
        """Remove a restaurant from the route"""
        if restaurant_id in self.route_restaurants:
            self.route_restaurants.remove(restaurant_id)
            return {"status": "removed", "route": self.route_restaurants}
        return {"status": "not_found", "route": self.route_restaurants}
    
    def get_route(self) -> List[dict]:
        """Get full restaurant data for all restaurants in route"""
        result = []
        for rest_id in self.route_restaurants:
            for restaurant in DATA_SOURCE:
                if restaurant.getId() == rest_id:
                    result.append(restaurant.to_dict())
                    break
        return result
    
    def clear_route(self) -> dict:
        """Clear all restaurants from the route"""
        self.route_restaurants = []
        return {"status": "cleared", "route": self.route_restaurants}
    
    def is_in_route(self, restaurant_id: int) -> bool:
        """Check if a restaurant is in the route"""
        return restaurant_id in self.route_restaurants

# ----------------------------------------------------------------------------
# SIMPLE SEARCH SERVICE FOR TOUR DESIGNER
# ----------------------------------------------------------------------------

@dataclass
class SimpleSearchQuery:
    queryText: str = ""
    searchBy: str = "all"  # Options: "name", "tags", "address", "all"

class SimpleSearchService:
    def __init__(self):
        self.all_restaurants = DATA_SOURCE

    def _matchesQuery(self, restaurant: Restaurant, query: SimpleSearchQuery) -> tuple[bool, str]:
        """
        Check if restaurant matches the search query based on searchBy field.
        Returns: (matches: bool, match_field: str)
        """
        if not query.queryText:
            return True, ""
        
        query_lower = query.queryText.lower()
        
        # Search by name only
        if query.searchBy == "name":
            matches = query_lower in restaurant.getName().lower()
            return matches, "name" if matches else ""
        
        # Search by tags only
        elif query.searchBy == "tags":
            matches = any(query_lower in tag.lower() for tag in restaurant.getTags())
            return matches, "tags" if matches else ""
        
        # Search all fields (default)
        else:
            in_name = query_lower in restaurant.getName().lower()
            in_tags = any(query_lower in tag.lower() for tag in restaurant.getTags())
            
            matches = in_name or in_tags
            
            # Determine which field matched
            if in_name:
                match_field = "name"
            elif in_tags:
                match_field = "tags"
            else:
                match_field = ""
            
            return matches, match_field

    def search(self, query: SimpleSearchQuery) -> List[dict]:
        """
        Main search method - filters restaurants by name or tags.
        """
        results = []
        
        for restaurant in self.all_restaurants:
            matches, match_field = self._matchesQuery(restaurant, query)
            
            if matches:
                res_dict = restaurant.to_dict()
                res_dict['match_field'] = match_field  # Shows where the match was found
                results.append(res_dict)
        
        return results

# ----------------------------------------------------------------------------
# FLASK API ENDPOINT
# ----------------------------------------------------------------------------

# Instantiate our services
location_service = LocationService()
hours_checker = HoursChecker() 
search_service = SearchService(location_service, hours_checker)
routing_handler = RoutingHandle()
simple_search_service = SimpleSearchService()

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
@app.route("/api/health", methods=['GET'])
def health_check():
    return jsonify({"status": "Culinary Compass API is running!"})

# ----------------------------------------------------------------------------
# TOUR DESIGNER API ENDPOINTS
# ----------------------------------------------------------------------------

@app.route("/api/tour/search", methods=['POST'])
def handle_tour_search():
    """   
    Request JSON body:
    {
        "queryText": "phở",
        "searchBy": "tags"  // Options: "name", "tags", "all"
    }
    """
    data = request.json
    
    query = SimpleSearchQuery(
        queryText=data.get('queryText', ''),
        searchBy=data.get('searchBy', 'all')
    )
    
    results = simple_search_service.search(query)
    
    return jsonify({
        "query": query.queryText,
        "searchBy": query.searchBy,
        "count": len(results),
        "results": results
    })

@app.route("/api/tour/restaurants", methods=['GET'])
def get_all_tour_restaurants():
    """Get all restaurants data for tour designer"""
    results = [r.to_dict() for r in simple_search_service.all_restaurants]
    return jsonify(results)

@app.route("/api/tour/route/add", methods=['POST'])
def add_to_tour_route():
    """Add a restaurant to the route
    Request JSON: {"restaurant_id": 1}
    """
    data = request.json
    restaurant_id = data.get('restaurant_id')
    
    if restaurant_id is None:
        return jsonify({"error": "Missing restaurant_id"}), 400
    
    result = routing_handler.add_restaurant(restaurant_id)
    return jsonify(result)

@app.route("/api/tour/route/remove", methods=['POST'])
def remove_from_tour_route():
    """Remove a restaurant from the route
    Request JSON: {"restaurant_id": 1}
    """
    data = request.json
    restaurant_id = data.get('restaurant_id')
    
    if restaurant_id is None:
        return jsonify({"error": "Missing restaurant_id"}), 400
    
    result = routing_handler.remove_restaurant(restaurant_id)
    return jsonify(result)

@app.route("/api/tour/route/get", methods=['GET'])
def get_tour_route():
    """Get all restaurants in current route"""
    restaurants = routing_handler.get_route()
    return jsonify({"count": len(restaurants), "route": restaurants})

@app.route("/api/tour/route/clear", methods=['POST'])
def clear_tour_route():
    """Clear all restaurants from the route"""
    result = routing_handler.clear_route()
    return jsonify(result)

@app.route("/api/tour/route/check/<int:restaurant_id>", methods=['GET'])
def check_in_tour_route(restaurant_id):
    """Check if a restaurant is in the route"""
    in_route = routing_handler.is_in_route(restaurant_id)
    return jsonify({"restaurant_id": restaurant_id, "in_route": in_route})

# ----------------------------------------------------------------------------
# SURVEY RECOMMENDATION API ENDPOINT
# ----------------------------------------------------------------------------

@app.route("/api/survey/recommendations", methods=['POST'])
def get_survey_recommendations():
    """
    Get restaurant recommendations based on survey preferences
    Request JSON body:
    {
        "dietary": ["none"] or ["vegetarian", "no-pork", etc.],
        "vibe": "street-food" | "casual-dining" | "fine-dining",
        "spice": "no-spice" | "medium-spice" | "bring-heat",
        "cravings": ["soup", "dry", "rice", "crispy", "dessert"]
    }
    """
    try:
        data = request.json
        
        # Validate input
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        dietary = data.get('dietary', [])
        vibe = data.get('vibe', '')
        spice = data.get('spice', '')
        cravings = data.get('cravings', [])
        
        # Validate required fields
        if not cravings:
            return jsonify({"error": "At least one craving must be selected"}), 400
        
        # Start with all restaurants
        all_restaurants = list(simple_search_service.all_restaurants)
        filtered_restaurants = list(all_restaurants)
        
        # Apply filters progressively with fallback
        original_count = len(filtered_restaurants)
        
        # Filter by dietary restrictions (strictest filter)
        if dietary and 'none' not in dietary:
            dietary_filtered = filter_by_dietary(filtered_restaurants, dietary)
            # Only apply if we still have results
            if len(dietary_filtered) >= 3:
                filtered_restaurants = dietary_filtered
            else:
                # Too strict, keep original and warn
                print(f"Warning: Dietary filter too strict ({len(dietary_filtered)} results), keeping all")
        
        # Filter by cravings (dish types) - important filter
        if cravings:
            craving_filtered = filter_by_cravings(filtered_restaurants, cravings)
            # Only apply if we have results
            if craving_filtered:
                filtered_restaurants = craving_filtered
        
        # Filter by vibe (dining experience) - can be lenient
        if vibe:
            vibe_filtered = filter_by_vibe(filtered_restaurants, vibe)
            # Only apply if we have enough results
            if len(vibe_filtered) >= 3:
                filtered_restaurants = vibe_filtered
        
        # Filter/rank by spice tolerance (reordering, not eliminating)
        if spice:
            filtered_restaurants = filter_by_spice(filtered_restaurants, spice)
        
        # Edge case: If still no results, return top rated restaurants
        if len(filtered_restaurants) == 0:
            print("Warning: No restaurants match filters, returning top rated")
            filtered_restaurants = sorted(all_restaurants, key=lambda r: r.rating, reverse=True)[:5]
        
        # Sort by rating to get the best matches
        filtered_restaurants.sort(key=lambda r: r.rating, reverse=True)
        
        # Return top 3-5 restaurants (at least 3, up to 5)
        top_count = min(5, max(3, len(filtered_restaurants)))
        top_restaurants = filtered_restaurants[:top_count]
        
        return jsonify({
            "count": len(top_restaurants),
            "totalFiltered": len(filtered_restaurants),
            "restaurants": [r.to_dict() for r in top_restaurants],
            "preferences": {
                "dietary": dietary,
                "vibe": vibe,
                "spice": spice,
                "cravings": cravings
            }
        })
    
    except Exception as e:
        print(f"Error in survey recommendations: {str(e)}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

def filter_by_dietary(restaurants, dietary_restrictions):
    """Filter restaurants based on dietary restrictions"""
    filtered = []
    
    for restaurant in restaurants:
        exclude = False
        
        # Check if restaurant matches dietary restrictions
        if 'vegetarian' in dietary_restrictions:
            # Only include if restaurant has vegetarian options
            if 'Vegetarian' not in restaurant.specialFlags and 'Vegan options' not in restaurant.specialFlags:
                # Check if main ingredients don't contain meat
                main_ingredients_lower = [ing.lower() for ing in restaurant.tags]
                meat_items = ['beef', 'pork', 'chicken', 'duck', 'meat', 'thịt', 'bò', 'gà', 'heo']
                if any(meat in ' '.join(main_ingredients_lower) for meat in meat_items):
                    exclude = True
        
        if 'vegan' in dietary_restrictions:
            if 'Vegan options' not in restaurant.specialFlags:
                # Very strict - exclude most restaurants without explicit vegan flag
                exclude = True
        
        if 'no-pork' in dietary_restrictions:
            # Check tags and cuisines for pork
            all_text = ' '.join(restaurant.tags + restaurant.cuisines).lower()
            if 'pork' in all_text or 'heo' in all_text or 'sườn' in all_text or 'bì' in all_text:
                exclude = True
        
        if 'no-seafood' in dietary_restrictions:
            if 'No Seafood' in restaurant.specialFlags:
                # This restaurant explicitly has no seafood - good!
                pass
            else:
                # Check for seafood in tags
                all_text = ' '.join(restaurant.tags + restaurant.cuisines).lower()
                seafood_items = ['seafood', 'shrimp', 'tôm', 'cá', 'fish', 'crab', 'cua', 'mực', 'squid', 'hải sản']
                if any(item in all_text for item in seafood_items):
                    exclude = True
        
        if 'no-peanuts' in dietary_restrictions:
            # This is tricky - Vietnamese food often has peanuts
            # We'll be cautious and exclude dishes that commonly have peanuts
            all_text = ' '.join(restaurant.tags).lower()
            if 'gỏi cuốn' in all_text or 'spring roll' in all_text:
                exclude = True
        
        if not exclude:
            filtered.append(restaurant)
    
    return filtered

def filter_by_vibe(restaurants, vibe):
    """Filter restaurants based on dining atmosphere"""
    filtered = []
    
    for restaurant in restaurants:
        include = False
        
        if vibe == 'street-food':
            # Look for street food indicators
            if restaurant.averagePrice < 100000:  # Less than 100k VND
                include = True
            # Check dish types
            dish_types_lower = [dt.lower() for dt in restaurant.tags]
            if any(term in ' '.join(dish_types_lower) for term in ['street', 'phở', 'bánh mì', 'cơm tấm']):
                include = True
        
        elif vibe == 'casual-dining':
            # Mid-range pricing
            if 80000 <= restaurant.averagePrice <= 400000:
                include = True
        
        elif vibe == 'fine-dining':
            # Higher price point
            if restaurant.averagePrice >= 400000:
                include = True
        
        if include:
            filtered.append(restaurant)
    
    return filtered if filtered else restaurants  # Return all if no matches

def filter_by_spice(restaurants, spice_level):
    """Filter or prioritize restaurants based on spice tolerance"""
    if spice_level == 'no-spice':
        # Exclude spicy dishes
        filtered = []
        for restaurant in restaurants:
            tags_text = ' '.join(restaurant.tags).lower()
            # Exclude Bún Bò Huế and other spicy dishes
            if 'bún bò huế' not in tags_text and 'spicy' not in tags_text:
                filtered.append(restaurant)
        return filtered if filtered else restaurants  # Return all if filtering is too strict
    
    elif spice_level == 'bring-heat':
        # Prioritize spicy dishes
        spicy = []
        others = []
        for restaurant in restaurants:
            tags_text = ' '.join(restaurant.tags).lower()
            if 'bún bò huế' in tags_text or 'spicy' in tags_text:
                spicy.append(restaurant)
            else:
                others.append(restaurant)
        return spicy + others  # Spicy first, then others
    
    # Medium spice - return all
    return restaurants

def filter_by_cravings(restaurants, cravings):
    """Filter restaurants based on dish type cravings"""
    filtered = []
    
    # Map craving types to dish identifiers
    craving_map = {
        'soup': ['phở', 'bún bò', 'hủ tiếu', 'soup', 'noodle'],
        'dry': ['bánh mì', 'sandwich'],
        'rice': ['cơm tấm', 'cơm', 'rice'],
        'crispy': ['bánh xèo', 'fried', 'crispy', 'spring roll', 'gỏi cuốn', 'chả giò'],
        'dessert': ['chè', 'dessert', 'sweet']
    }
    
    for restaurant in restaurants:
        tags_text = ' '.join(restaurant.tags + restaurant.cuisines).lower()
        
        # Check if any craving matches this restaurant
        for craving in cravings:
            if craving in craving_map:
                keywords = craving_map[craving]
                if any(keyword in tags_text for keyword in keywords):
                    filtered.append(restaurant)
                    break  # Only add once
    
    return filtered if filtered else restaurants  # Return all if no matches

# Start the Flask server
if __name__ == "__main__":
    app.run(debug=True, port=5000)