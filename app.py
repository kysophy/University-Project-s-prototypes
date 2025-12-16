import math
import json
import re
import time
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, time
from typing import List, Optional, Tuple, Dict
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

# Try to import requests for Ollama (optional)
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("⚠️ requests not installed. Install with: pip install requests (for Ollama support)")

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
    def getPriceText(self) -> str: return self.price_text

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

# Loading data for chatbot
CHAT_DATA = {}
DISHES_DATA = {}
REGIONS_DATA = []

try:
    with open('data/data_chat.json', 'r', encoding='utf-8') as f:
        CHAT_DATA = json.load(f)
except FileNotFoundError:
    print("⚠️ data_chat.json not found")

try:
    with open('data/dishes.json', 'r', encoding='utf-8') as f:
        DISHES_DATA = json.load(f)
except FileNotFoundError:
    print("⚠️ dishes.json not found")

try:
    with open('data/regions.json', 'r', encoding='utf-8') as f:
        REGIONS_DATA = json.load(f).get('regions', [])
except FileNotFoundError:
    print("⚠️ regions.json not found")

#Configure the chatbot:

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"  # Change to your preferred model
USE_OLLAMA = True  # Set False to use rule-based only
OLLAMA_TIMEOUT = 15

# Response cache
chatbot_cache = {}

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
# FREE CHATBOT IMPLEMENTATION (Ollama + Enhanced Rules)
# ----------------------------------------------------------------------------

def check_ollama_available() -> bool:
    """Check if Ollama is running and available"""
    if not USE_OLLAMA or not REQUESTS_AVAILABLE:
        return False
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [m.get('name', '') for m in models]
            return any(OLLAMA_MODEL in name for name in model_names)
    except:
        pass
    return False

def get_restaurant_summary_for_ai() -> str:
    """Create compressed summary of restaurants for AI context"""
    if not DATA_SOURCE:
        return "No restaurant data available."
    summaries = []
    # Include more restaurants for better context (up to 30)
    for r in DATA_SOURCE[:30]:
        cuisines = ', '.join(r.getCuisines()[:2])
        price_info = f"{r.getPriceText()} (avg: {r.getAveragePrice():,} VND)"
        summaries.append(
            f"{r.getName()}: {cuisines}, Rating {r.getRating()}/5, {price_info}, "
            f"Tags: {', '.join(r.getTags()[:3])}"
        )
    
    # Add price statistics
    prices = [r.getAveragePrice() for r in DATA_SOURCE if r.getAveragePrice() > 0]
    if prices:
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        price_stats = f"\n\nPRICE STATISTICS: Average {avg_price:,.0f} VND, Range: {min_price:,.0f} - {max_price:,.0f} VND"
        return "\n".join(summaries) + price_stats
    
    return "\n".join(summaries)

def get_dish_summary_for_ai() -> str:
    """Create summary of dishes for AI context"""
    if not DISHES_DATA.get('dishes'):
        return "No dish data available."
    dishes = []
    for dish_id, dish in list(DISHES_DATA.get('dishes', {}).items())[:15]:
        name = dish.get('name', 'Unknown')
        desc = dish.get('description', '')[:80]
        ingredients = ', '.join(dish.get('ingredients', [])[:5])
        dishes.append(f"{name}: {desc}. Ingredients: {ingredients}")
    return "\n".join(dishes)

def get_region_summary_for_ai() -> str:
    """Create summary of regions for AI context"""
    if not REGIONS_DATA:
        return "No region data available."
    regions = []
    for reg in REGIONS_DATA[:5]:
        specialties = ', '.join(reg.get('specialties', [])[:3])
        regions.append(f"{reg.get('nameEn', reg.get('name', ''))}: {specialties}")
    return "\n".join(regions)

def parse_price(price_str: str) -> Optional[int]:
    """Parse price from string like '50k', '50000', etc."""
    try:
        price_str = price_str.replace(',', '').lower().strip()
        if price_str.endswith('k'):
            return int(float(price_str[:-1]) * 1000)
        return int(float(price_str))
    except:
        return None

def try_rule_based_chatbot(user_message: str) -> Optional[Dict]:
    """
    Enhanced rule-based chatbot using project data
    Returns response dict or None if can't handle
    """
    query_lower = user_message.lower()
    
    # 1. Check data_chat.json first (existing keyword matching)
    if CHAT_DATA:
        best_key = None
        best_score = 0
        for key, entry in CHAT_DATA.items():
            keywords = entry.get('keywords', [])
            score = 0
            for kw in keywords:
                kw_lower = kw.lower()
                if query_lower == kw_lower:
                    score += 4
                elif kw_lower in query_lower:
                    score += 2
                elif any(len(p) > 2 and p in query_lower for p in kw_lower.split()):
                    score += 1
            if score > best_score:
                best_score = score
                best_key = key
        
        if best_key and best_score > 0:
            responses = CHAT_DATA[best_key].get('responses', [])
            if responses:
                return {
                    'response': responses[0] if len(responses) == 1 else responses[hash(user_message) % len(responses)],
                    'confidence': 0.9,
                    'source': 'data_chat'
                }
    
    # 2. Greeting
    if any(word in query_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        return {
            'response': '👋 Hey there! Ready to explore some amazing Vietnamese food in Ho Chi Minh City?',
            'confidence': 0.95,
            'source': 'rule-based'
        }
    
    # 2.5. Spiciness queries (general or dish-specific)
    if any(word in query_lower for word in ['spicy', 'spice', 'heat', 'hot', 'how spicy', 'spiciness']):
        # Check if asking about a specific dish
        dishes = DISHES_DATA.get('dishes', {})
        for dish_id, dish in dishes.items():
            dish_name = dish.get('name', '').lower()
            if dish_name and dish_name in query_lower:
                # Check if dish is known to be spicy
                description = dish.get('description', '').lower()
                dish_id_lower = dish_id.lower()
                # Bún Bò Huế is famously spicy
                is_spicy = 'bún bò huế' in dish_name or 'bun bo hue' in dish_id_lower or 'spicy' in description
                
                if is_spicy:
                    return {
                        'response': f"🌶️ {dish.get('name')} is known to be quite spicy! It typically has a bold, fiery flavor. If you're sensitive to spice, you can ask for it less spicy ('ít cay' in Vietnamese).",
                        'confidence': 0.9,
                        'source': 'rule-based'
                    }
                else:
                    return {
                        'response': f"🍜 {dish.get('name')} is generally not very spicy, but you can add chili sauce or fresh chilies to adjust the heat level to your preference!",
                        'confidence': 0.9,
                        'source': 'rule-based'
                    }
        
        # General spiciness question about Vietnamese food
        return {
            'response': (
                "🌶️ Vietnamese food in Ho Chi Minh City varies in spiciness:\n"
                "• **Mild dishes**: Phở, Bánh Mì, Cơm Tấm, Hủ Tiếu (usually not spicy)\n"
                "• **Spicy dishes**: Bún Bò Huế, some noodle soups with chili\n"
                "• **Customizable**: Most places let you add chili sauce or fresh chilies to adjust heat\n"
                "• **Tip**: Say 'không cay' (not spicy) or 'ít cay' (less spicy) when ordering!"
            ),
            'confidence': 0.9,
            'source': 'rule-based'
        }
    
    # 3. Dish information queries
    dishes = DISHES_DATA.get('dishes', {})
    for dish_id, dish in dishes.items():
        dish_name = dish.get('name', '').lower()
        dish_name_no_diacritics = dish_name.replace('ở', 'o').replace('ấ', 'a').replace('ế', 'e').replace('ì', 'i').replace('ạ', 'a')
        query_no_diacritics = query_lower.replace('ở', 'o').replace('ấ', 'a').replace('ế', 'e').replace('ì', 'i').replace('ạ', 'a')
        
        # Match dish name (with or without diacritics, or partial match)
        dish_matched = (dish_name and dish_name in query_lower) or \
                      (dish_name_no_diacritics and dish_name_no_diacritics in query_no_diacritics) or \
                      (dish_id.lower() in query_lower)
        
        if dish_matched:
            # Taste/Flavor query (check this FIRST before general description)
            taste_keywords = ['taste', 'flavor', 'flavour', 'tastes like', 'taste like', 'flavors like', 'flavours like']
            # Check for "how does [dish] taste" pattern
            has_taste_query = any(word in query_lower for word in taste_keywords) or \
                             ('how does' in query_lower and ('taste' in query_lower or 'flavor' in query_lower)) or \
                             ('what does' in query_lower and ('taste' in query_lower or 'flavor' in query_lower))
            
            if has_taste_query:
                flavors = dish.get('flavors', [])
                desc = dish.get('description', '')
                if flavors:
                    flavors_text = ', '.join(flavors)
                    response_text = f"🍜 {dish.get('name')} tastes: {flavors_text}."
                    if desc and 'flavor' in desc.lower():
                        # Include flavor description if available
                        flavor_desc = desc[:150] if len(desc) > 150 else desc
                        response_text += f" {flavor_desc}"
                    return {
                        'response': response_text,
                        'confidence': 0.95,
                        'source': 'rule-based'
                    }
                elif desc:
                    # Fallback to description if no flavors field
                    return {
                        'response': f"🍜 {dish.get('name')}: {desc[:200]}...",
                        'confidence': 0.85,
                        'source': 'rule-based'
                    }
            # Ingredients query
            if any(word in query_lower for word in ['ingredient', "what's in", 'what is in', 'recipe']):
                ingredients = dish.get('ingredients', [])[:8]
                if ingredients:
                    return {
                        'response': f"🧾 Ingredients for {dish.get('name')}: {', '.join(ingredients)}.",
                        'confidence': 0.9,
                        'source': 'rule-based'
                    }
            # History query
            if any(word in query_lower for word in ['history', 'origin', 'came from']):
                history = dish.get('history', '')
                if history:
                    return {
                        'response': f"📚 {dish.get('name')} — {history[:300]}...",
                        'confidence': 0.9,
                        'source': 'rule-based'
                    }
            # General dish info (fallback)
            desc = dish.get('description', '')
            if desc:
                return {
                    'response': f"🍜 {dish.get('name')}: {desc[:200]}...",
                    'confidence': 0.85,
                    'source': 'rule-based'
                }
    
    # 4. Price queries (improved matching)
    price_keywords = ['cheap', 'budget', 'affordable', 'under', 'less than', 'expensive', 'price', 'cost', 'pricing', 'how much', 'how cheap', 'how expensive']
    if any(word in query_lower for word in price_keywords):
        # Try to extract specific price threshold
        price_match = re.search(r'(\d+[km]?|\d+,\d+)', query_lower)
        threshold = 50000  # Default threshold
        if price_match:
            parsed = parse_price(price_match.group(1))
            if parsed:
                threshold = parsed
        
        # For "cheap" or "affordable" questions without specific number
        if any(word in query_lower for word in ['cheap', 'affordable', 'budget']) and not price_match:
            # Calculate price statistics for better AI context
            prices = [r.getAveragePrice() for r in DATA_SOURCE if r.getAveragePrice() > 0]
            if prices:
                avg_price = sum(prices) / len(prices)
                cheap_threshold = avg_price * 0.6  # 60% of average = cheap
                cheap = [r for r in DATA_SOURCE if r.getAveragePrice() <= cheap_threshold]
                cheap.sort(key=lambda x: x.getRating(), reverse=True)
                
                if cheap:
                    names = [r.getName() for r in cheap[:5]]
                    return {
                        'response': f"💸 Budget-friendly picks (under {int(cheap_threshold):,} VND): {', '.join(names)}. Most dishes here are very affordable!",
                        'confidence': 0.88,
                        'source': 'rule-based',
                        'restaurants': names
                    }
        
        # For specific price threshold queries
        cheap = [r for r in DATA_SOURCE if r.getAveragePrice() <= threshold]
        cheap.sort(key=lambda x: x.getRating(), reverse=True)
        
        if cheap:
            names = [r.getName() for r in cheap[:5]]
            return {
                'response': f"💸 Budget-friendly picks under {threshold:,} VND: {', '.join(names)}.",
                'confidence': 0.88,
                'source': 'rule-based',
                'restaurants': names
            }
        
        # If no matches but price-related query, return None to let AI handle it
        # This allows AI to provide more nuanced price information
        return None
    
    # 5. Cuisine queries
    cuisines_map = {
        'vietnamese': ['vietnamese', 'vietnam'],
        'chinese': ['chinese', 'china'],
        'japanese': ['japanese', 'japan'],
        'korean': ['korean', 'korea'],
        'vegetarian': ['vegetarian', 'veggie'],
        'vegan': ['vegan'],
    }
    
    for cuisine, keywords in cuisines_map.items():
        if any(kw in query_lower for kw in keywords):
            matches = [r for r in DATA_SOURCE if cuisine.lower() in [c.lower() for c in r.getCuisines()]]
            matches.sort(key=lambda x: x.getRating(), reverse=True)
            if matches:
                names = [r.getName() for r in matches[:5]]
                return {
                    'response': f"🍜 Top {cuisine} spots: {', '.join(names)}.",
                    'confidence': 0.85,
                    'source': 'rule-based',
                    'restaurants': names
                }
    
    # 6. Best/top queries
    if any(word in query_lower for word in ['best', 'top', 'recommend', 'suggest']):
        # Try to match dish
        for dish_id, dish in dishes.items():
            dish_name = dish.get('name', '').lower()
            if dish_name and dish_name in query_lower:
                matches = [
                    r for r in DATA_SOURCE
                    if dish_name in ' '.join([t.lower() for t in r.getTags()])
                ]
                matches.sort(key=lambda x: x.getRating(), reverse=True)
                if matches:
                    names = [r.getName() for r in matches[:5]]
                    return {
                        'response': f"🏆 Top places for {dish.get('name')}: {', '.join(names)}.",
                        'confidence': 0.85,
                        'source': 'rule-based',
                        'restaurants': names
                    }
        
        # General recommendation
        top_rated = sorted(DATA_SOURCE, key=lambda x: x.getRating(), reverse=True)[:5]
        names = [r.getName() for r in top_rated]
        return {
            'response': f"🌟 Top rated restaurants: {', '.join(names)}.",
            'confidence': 0.8,
            'source': 'rule-based',
            'restaurants': names
        }
    
    # 7. Restaurant name queries
    for restaurant in DATA_SOURCE:
        rname = restaurant.getName().lower()
        if rname and (rname in query_lower or query_lower in rname):
            return {
                'response': (
                    f"📍 {restaurant.getName()} — "
                    f"Rating: {restaurant.getRating()} • "
                    f"Price: {restaurant.getPriceText()} • "
                    f"Hours: {restaurant.getOpenHours()} • "
                    f"Address: {restaurant.getAddress() or 'N/A'}"
                ),
                'confidence': 0.9,
                'source': 'rule-based'
            }
    
    # 8. Region queries
    for region in REGIONS_DATA:
        region_names = [
            region.get('id', '').lower(),
            region.get('name', '').lower(),
            region.get('nameEn', '').lower()
        ]
        if any(rn in query_lower for rn in region_names if rn):
            specialties = ', '.join(region.get('specialties', [])[:5])
            return {
                'response': f"📌 {region.get('nameEn', region.get('name'))} specialties: {specialties}. Want restaurant recommendations?",
                'confidence': 0.85,
                'source': 'rule-based'
            }
    
    return None  # Can't handle with rules

def get_ollama_ai_response(query: str, context: str = "", history: List[Dict] = None) -> Dict:
    """
    Get AI response from local Ollama model
    The AI can reason about the data and provide intelligent solutions
    """
    if not USE_OLLAMA or not REQUESTS_AVAILABLE or not check_ollama_available():
        return {'response': None, 'source': 'ollama_unavailable', 'cost': 0.0}
    
    # Build comprehensive context from project data
    restaurant_summary = get_restaurant_summary_for_ai()
    dish_summary = get_dish_summary_for_ai()
    region_summary = get_region_summary_for_ai()
    
    # Build intelligent prompt that encourages reasoning
    prompt = f"""You are an expert Vietnamese food assistant for Ho Chi Minh City. You have access to REAL DATA about restaurants, dishes, and regions. Use this data to answer questions accurately.

AVAILABLE DATA:

Restaurants (with ratings, prices in VND, cuisines, tags):
{restaurant_summary}

Dishes (with ingredients, descriptions, history, flavors):
{dish_summary}

Regions (with specialties):
{region_summary}

USER QUESTION: {query}

IMPORTANT INSTRUCTIONS:
1. **PRICE QUESTIONS**: When asked about prices, cheapness, or affordability:
   - Reference the actual price data provided above
   - Mention specific price ranges from the data
   - Compare prices between restaurants if relevant
   - Use the price statistics to give context (e.g., "Most restaurants range from X to Y VND")
   - Be specific: "Very affordable" means under 50k VND, "Mid-range" is 50k-150k, "Expensive" is 150k+

2. **RESTAURANT RECOMMENDATIONS**: 
   - Always use REAL restaurant names from the data above
   - Include ratings and price info when relevant
   - Explain WHY you're recommending them

3. **DISH INFORMATION**:
   - Use the dish data for ingredients, flavors, history
   - Be specific about taste profiles from the flavors data

4. **GENERAL GUIDELINES**:
   - Be conversational, friendly, and use emojis (🍜 🍚 🥖 📍 💸 🌶️)
   - Keep responses informative but concise (100-200 words)
   - If the data doesn't have what they need, say so honestly
   - Think step-by-step: What is the user really asking? What data is relevant?

5. **EXAMPLES OF GOOD RESPONSES**:
   - Price question: "Food here is very affordable! Based on our data, most restaurants range from 25,000-80,000 VND per dish. Street food is typically 20,000-50,000 VND, while sit-down restaurants are 50,000-150,000 VND. Here are some budget-friendly options: [list restaurants from data]"
   - Dish question: "Cơm Tấm has flavors of: Sweet and light, Grilled aroma, Rich and fatty, Sweet and sour. It's a signature Saigon dish with broken rice, grilled pork, and pickled vegetables."

Now analyze the user's question and provide a helpful, data-driven response:"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 250  # Allow more tokens for reasoning
                }
            },
            timeout=OLLAMA_TIMEOUT
        )
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '').strip()
            
            # Clean up response
            if "response:" in response_text.lower():
                response_text = response_text.split("response:")[-1].strip()
            if "think" in response_text.lower()[:50]:
                # Remove thinking process if included
                lines = response_text.split('\n')
                response_text = '\n'.join([l for l in lines if not l.strip().startswith('Think')])
            
            return {
                'response': response_text,
                'source': 'ollama_ai',
                'cost': 0.0,
                'model': OLLAMA_MODEL
            }
        else:
            return {'response': None, 'source': 'error', 'cost': 0.0}
    except requests.exceptions.Timeout:
        return {
            'response': "I'm taking too long to respond. Please try a simpler question or check if Ollama is running.",
            'source': 'timeout',
            'cost': 0.0
        }
    except Exception as e:
        print(f"Ollama error: {e}")
        return {'response': None, 'source': 'error', 'cost': 0.0}

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    """
    Enhanced FREE chatbot endpoint
    Uses rule-based first, then AI (Ollama) for complex queries
    Can reason about project data and provide intelligent solutions
    """
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        conversation_history = data.get('history', [])
        
        if not user_message:
            return jsonify({
                'response': "Please provide a message.",
                'source': 'error'
            }), 400
        
        # Check cache
        cache_key = hashlib.md5(user_message.lower().strip().encode()).hexdigest()
        if cache_key in chatbot_cache:
            cached = chatbot_cache[cache_key]
            if time.time() - cached.get('timestamp', 0) < 3600:  # 1 hour TTL
                return jsonify({
                    'response': cached['response'],
                    'restaurants': cached.get('restaurants', []),
                    'source': cached.get('source', 'cached')
                })
        
        # Step 1: Try rule-based first (fast, uses project data)
        # Only use rule-based for very high confidence matches (0.9+)
        # This allows AI to handle more varied questions
        rule_response = try_rule_based_chatbot(user_message)
        
        if rule_response and rule_response.get('confidence', 0) >= 0.9:
            result = {
                'response': rule_response['response'],
                'restaurants': rule_response.get('restaurants', []),
                'source': rule_response['source'],
                'confidence': rule_response['confidence']
            }
        else:
            # Step 2: Use AI for most queries (can reason about data and handle variations)
            # AI is better at understanding intent and providing contextual answers
            ollama_response = get_ollama_ai_response(user_message, history=conversation_history)
            
            if ollama_response.get('response'):
                result = {
                    'response': ollama_response['response'],
                    'restaurants': [],
                    'source': ollama_response['source'],
                    'cost': 0.0
                }
            else:
                # Step 3: Fallback - If AI unavailable, try rule-based with lower threshold
                # This ensures the chatbot still works even without Ollama
                if rule_response and rule_response.get('confidence', 0) >= 0.7:
                    # Use rule-based response even if confidence is lower
                    result = {
                        'response': rule_response['response'],
                        'restaurants': rule_response.get('restaurants', []),
                        'source': rule_response['source'] + '_fallback',
                        'confidence': rule_response['confidence']
                    }
                else:
                    # Final fallback - generic helpful message
                    result = {
                        'response': (
                            "I understand you're looking for information about Vietnamese food in Ho Chi Minh City. "
                            "Could you be more specific? For example:\n"
                            "• 'What is phở?'\n"
                            "• 'Best restaurants under 50k'\n"
                            "• 'Tell me about Vietnamese cuisine'\n"
                            "• 'Where can I find vegetarian options?'\n\n"
                            "💡 Tip: For AI-powered responses, make sure Ollama is running with llama3.2:3b model."
                        ),
                        'source': 'fallback'
                    }
        
        # Cache the response
        chatbot_cache[cache_key] = {
            'response': result['response'],
            'restaurants': result.get('restaurants', []),
            'source': result.get('source', 'unknown'),
            'timestamp': time.time()
        }
        
        # Clean old cache (keep last 500)
        if len(chatbot_cache) > 500:
            sorted_cache = sorted(
                chatbot_cache.items(),
                key=lambda x: x[1].get('timestamp', 0)
            )
            for key, _ in sorted_cache[:-500]:
                del chatbot_cache[key]
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Chatbot error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'response': "I'm sorry, I encountered an error. Please try again.",
            'source': 'error'
        }), 500

@app.route('/api/chatbot/stats', methods=['GET'])
def chatbot_stats():
    """Get chatbot statistics"""
    ollama_available = check_ollama_available()
    
    return jsonify({
        'ollama_available': ollama_available,
        'ollama_model': OLLAMA_MODEL if ollama_available else None,
        'use_ollama': USE_OLLAMA,
        'cache_size': len(chatbot_cache),
        'restaurants_loaded': len(DATA_SOURCE),
        'dishes_loaded': len(DISHES_DATA.get('dishes', {})),
        'regions_loaded': len(REGIONS_DATA),
        'chat_data_loaded': len(CHAT_DATA),
        'cost': 0.0,  # Always free!
        'source': 'free_implementation'
    })

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
    print("\n" + "="*60)
    print("🍜 Culinary Compass Chatbot Server Starting...")
    print("="*60)
    
    # Check Ollama status
    ollama_status = check_ollama_available()
    if ollama_status:
        print(f"✅ Ollama is running with model: {OLLAMA_MODEL}")
        print("   → AI-powered responses are ENABLED")
        print("   → Most queries will use AI to learn from your data")
    else:
        print("⚠️  Ollama is NOT available")
        print("   → Chatbot will use rule-based responses only")
        print("   → To enable AI: Install Ollama and run: ollama pull llama3.2:3b")
        print("   → See OLLAMA_SETUP_GUIDE.md for instructions")
    
    print(f"\n📊 Data loaded:")
    print(f"   → Restaurants: {len(DATA_SOURCE)}")
    print(f"   → Dishes: {len(DISHES_DATA.get('dishes', {}))}")
    print(f"   → Regions: {len(REGIONS_DATA)}")
    print(f"\n🚀 Server running on http://localhost:5000")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000)