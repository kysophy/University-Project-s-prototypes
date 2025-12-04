"""
Restaurant Search API for Culinary Compass Vietnam
Integrated from Search-With-Filter module

To run this server:
1. Install dependencies: pip install flask flask-cors
2. Run: python search_api.py
3. Server will start on http://localhost:5000
"""

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
                 distance_text: str, price_text: str, address: str = ""):
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
    def parseTime(self, time_str: str) -> Optional[time]:
        try:
            return datetime.strptime(time_str.strip(), "%H:%M").time()
        except ValueError:
            return None

    def parseOpenHours(self, openHours: str) -> Optional[Tuple[time, time]]:
        if " - " not in openHours:
            return None
        parts = openHours.split(" - ")
        if len(parts) != 2:
            return None
        start_time = self.parseTime(parts[0])
        end_time = self.parseTime(parts[1])
        if start_time is None or end_time is None:
            return None
        return (start_time, end_time)

    def isOpenNow(self, openHours: str) -> bool:
        hours_tuple = self.parseOpenHours(openHours)
        if hours_tuple is None:
            return True
        start_time, end_time = hours_tuple
        now_time = datetime.now().time()
        if start_time <= end_time:
            return start_time <= now_time <= end_time
        else:
            return now_time >= start_time or now_time <= end_time

class SearchEngine:
    def __init__(self, restaurants: List[Restaurant],
                 locationService: LocationService, hoursChecker: HoursChecker):
        self.restaurants = restaurants
        self.locationService = locationService
        self.hoursChecker = hoursChecker

    def isTextMatch(self, restaurant: Restaurant, queryText: str) -> bool:
        if not queryText:
            return True
        lowerQuery = queryText.lower()
        if lowerQuery in restaurant.getName().lower():
            return True
        for cuisine in restaurant.getCuisines():
            if lowerQuery in cuisine.lower():
                return True
        for tag in restaurant.getTags():
            if lowerQuery in tag.lower():
                return True
        return False

    def isPriceMatch(self, restaurant: Restaurant, priceRange: Optional[str]) -> bool:
        if not priceRange:
            return True
        avgPrice = restaurant.getAveragePrice()
        if priceRange == "low":
            return avgPrice < 25000
        elif priceRange == "mid":
            return 25000 <= avgPrice <= 50000
        elif priceRange == "high":
            return avgPrice > 50000
        return True

    def isCuisineMatch(self, restaurant: Restaurant, cuisines: List[str]) -> bool:
        if not cuisines:
            return True
        restaurantCuisines = restaurant.getCuisines()
        for c in cuisines:
            if c in restaurantCuisines:
                return True
        return False

    def isSpecialFlagMatch(self, restaurant: Restaurant, specialFlags: List[str]) -> bool:
        if not specialFlags:
            return True
        restaurantFlags = restaurant.getSpecialFlags()
        for flag in specialFlags:
            if flag in restaurantFlags:
                return True
        return False

    def search(self, query: SearchQuery) -> List[Restaurant]:
        results = []
        for restaurant in self.restaurants:
            distance = self.locationService.calculateDistance(query.userLocation, restaurant.getLocation())
            if distance > query.radiusKm:
                continue
            if not self.isTextMatch(restaurant, query.queryText):
                continue
            if not self.isPriceMatch(restaurant, query.priceRange):
                continue
            if not self.isCuisineMatch(restaurant, query.cuisines):
                continue
            if not self.isSpecialFlagMatch(restaurant, query.specialFlags):
                continue
            if query.openNow and not self.hoursChecker.isOpenNow(restaurant.getOpenHours()):
                continue
            results.append((restaurant, distance))

        if query.sortBy == "distance":
            results.sort(key=lambda x: x[1])
        elif query.sortBy == "rating":
            results.sort(key=lambda x: x[0].getRating(), reverse=True)

        return [r[0] for r in results]

# ----------------------------------------------------------------------------
# FLASK APP
# ----------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend to call API

# Load restaurant data
def load_restaurants():
    try:
        with open('data/restaurants.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            restaurants = []
            for item in data:
                loc = Coordinates(item['location']['latitude'], item['location']['longitude'])
                restaurant = Restaurant(
                    id=item['id'],
                    name=item['name'],
                    rating=item['rating'],
                    averagePrice=item['averagePrice'],
                    cuisines=item['cuisines'],
                    tags=item['tags'],
                    openHours=item['openHours'],
                    specialFlags=item['specialFlags'],
                    location=loc,
                    image_url=item.get('image_url', ''),
                    distance_text=item.get('distance_text', ''),
                    price_text=item.get('price_text', ''),
                    address=item.get('address', '')
                )
                restaurants.append(restaurant)
            return restaurants
    except FileNotFoundError:
        print("⚠️ Warning: restaurants.json not found. Using empty list.")
        return []
    except Exception as e:
        print(f"⚠️ Error loading restaurants: {e}")
        return []

# Initialize services
restaurants = load_restaurants()
locationService = LocationService()
hoursChecker = HoursChecker()
searchEngine = SearchEngine(restaurants, locationService, hoursChecker)

@app.route('/')
def index():
    return '''
    <html>
        <head>
            <title>Culinary Compass API</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f8f8f8;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #EA580C; }
                .status { color: #10B981; font-weight: 600; }
                code {
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🍜 Culinary Compass API</h1>
                <p class="status">✅ Server is running!</p>
                <p>This is the backend API for restaurant search functionality.</p>
                <h3>API Endpoint:</h3>
                <code>POST /api/search</code>
                <h3>Total Restaurants:</h3>
                <p><strong>''' + str(len(restaurants)) + '''</strong> restaurants loaded</p>
                <h3>Usage:</h3>
                <p>The frontend search page at <code>pages/features/search.html</code> connects to this API.</p>
            </div>
        </body>
    </html>
    '''

@app.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.json
        
        userLat = data.get('userLatitude', 10.7725)
        userLon = data.get('userLongitude', 106.6980)
        userLocation = Coordinates(userLat, userLon)
        
        query = SearchQuery(
            userLocation=userLocation,
            queryText=data.get('queryText', ''),
            radiusKm=data.get('radiusKm', 10.0),
            priceRange=data.get('priceRange', None),
            sortBy=data.get('sortBy', 'distance'),
            openNow=data.get('openNow', False),
            cuisines=data.get('cuisines', []),
            specialFlags=data.get('specialFlags', [])
        )
        
        results = searchEngine.search(query)
        
        # Calculate distance text for each result
        for restaurant in results:
            distance = locationService.calculateDistance(userLocation, restaurant.getLocation())
            if distance < 1:
                restaurant.distance_text = f"{int(distance * 1000)}m"
            else:
                restaurant.distance_text = f"{distance:.1f}km"
        
        return jsonify([r.to_dict() for r in results])
    
    except Exception as e:
        print(f"Error in search endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🍜 Culinary Compass API Server")
    print("=" * 50)
    print(f"✅ Loaded {len(restaurants)} restaurants")
    print("🌐 Server starting on http://localhost:5000")
    print("📝 API endpoint: POST http://localhost:5000/api/search")
    print("=" * 50)
    app.run(debug=True, port=5000)

