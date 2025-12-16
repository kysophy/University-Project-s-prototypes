# 🍜 Culinary Compass Vietnam

> Discover Vietnamese Cuisine - Khám phá ẩm thực Việt Nam

A comprehensive web application for exploring Vietnamese cuisine across different regions. Find restaurants, discover signature dishes, plan culinary tours, and get personalized food recommendations powered by AI.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technologies](#-technologies)
- [Getting Started](#-getting-started)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Features in Detail](#-features-in-detail)
- [Known Issues](#-known-issues)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Features
- 🗺️ **Region Exploration** - Explore 4 major Vietnamese regions (Hanoi, Ho Chi Minh City, Da Nang, Hue) with their signature dishes
- 🍲 **Dish Database** - Detailed information about Vietnamese dishes including ingredients, flavors, history, and pricing
- 🏪 **Restaurant Search** - Advanced search and filtering system with location-based recommendations
- 🤖 **AI-Powered Chatbot** - Interactive chatbot with rule-based and AI (Ollama) responses for food-related queries
- 🎯 **Food Survey** - Personalized restaurant recommendations based on dietary preferences, spice tolerance, and cravings
- 🗺️ **Tour Designer** - Create custom culinary tours by adding restaurants to your route
- 📍 **Location Services** - Distance calculation and restaurant filtering based on user location
- ⭐ **Favorites System** - Save your favorite restaurants and dishes
- 👤 **User Authentication** - Login/Register system with persistent sessions
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- 🎨 **Modern UI/UX** - Beautiful animations and intuitive interface

### Advanced Features
- 🔍 **Smart Filtering** - Filter by cuisine type, price range, distance, opening hours, and special requirements
- 💬 **Contextual Chatbot** - Understands dish information, restaurant recommendations, pricing, and regional specialties
- 🧭 **Tour Navigation** - Navigate through your custom restaurant tour
- 📊 **Tour History** - Track your previous culinary tours
- 🎨 **Profile Management** - User profiles with preferences and history

---

## 🛠️ Technologies

### Backend
- **Python 3.7+** - Core programming language
- **Flask** - Web framework for API endpoints
- **Flask-CORS** - Cross-origin resource sharing support
- **Ollama** (Optional) - Local AI model for enhanced chatbot responses

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **LocalStorage** - Client-side data persistence

### Data
- **JSON** - Data storage format for restaurants, dishes, and regions

---

## 🚀 Getting Started

### Requirements

- **Python 3.7+** - [Download Python](https://www.python.org/downloads/)
- **Web Browser** - Modern browser with JavaScript enabled
- **GPS Permission** (Optional) - For location-based features
- **Internet Connection** - Required for map tiles and routing (if using external map services)

### Installation

1. **Clone or download the project**


2. **Install Python dependencies**
   ```bash
   pip install flask flask-cors requests
   ```
   
   Note: `requests` is optional but recommended for full chatbot functionality with Ollama.

3. **Optional: Set up Ollama for AI-powered chatbot**
   - Install [Ollama](https://ollama.ai/)
   - Pull the required model:
     ```bash
     ollama pull llama3.2:3b
     ```
   - See `Materials/OLLAMA_SETUP_GUIDE.md` for detailed instructions

### Running the Project

1. **Start the backend server**
   ```bash
   python app.py
   ```
   
   The server will start on `http://localhost:5000`

2. **Open the frontend**
   - Option 1: Open `index.html` directly in your web browser
   - Option 2: Navigate to `http://localhost:5000` if Flask is configured to serve the frontend

3. **Verify the setup**
   - Check the terminal for server status
   - Visit `http://localhost:5000/api/health` to verify the API is running
   - The chatbot will work with rule-based responses even without Ollama

---

## 📁 Project Structure

```
v0.4/
├── app.py                 # Flask backend server
├── search_api.py          # Search API utilities
├── index.html            # Main landing page
│
├── assets/
│   ├── css/              # Stylesheets
│   │   ├── global.css
│   │   ├── components.css
│   │   └── pages/        # Page-specific styles
│   ├── js/               # JavaScript files
│   │   ├── main.js
│   │   ├── auth.js
│   │   └── pages/        # Page-specific scripts
│   └── images/           # Image assets
│
├── pages/                # HTML pages
│   ├── regions/          # Region-specific pages
│   └── features/         # Feature pages
│
├── data/                 # JSON data files
│   ├── restaurants.json
│   ├── dishes.json
│   ├── regions.json
│   └── data_chat.json    # Chatbot data
│
├── docs/                 # Documentation
│   ├── README.md
│   └── STRUCTURE.md      # Detailed structure guide
│
└── Materials/            # Additional resources
    ├── OLLAMA_SETUP_GUIDE.md
    └── CHATBOT_AI_EXPLANATION.md
```

For detailed structure information, see `docs/STRUCTURE.md`.

---

## 🔌 API Endpoints

### Search & Filtering
- `POST /api/search` - Search restaurants with filters (location, price, cuisine, etc.)
- `GET /api/health` - Health check endpoint

### Tour Designer
- `POST /api/tour/search` - Search restaurants for tour planning
- `GET /api/tour/restaurants` - Get all restaurants
- `POST /api/tour/route/add` - Add restaurant to tour route
- `POST /api/tour/route/remove` - Remove restaurant from route
- `GET /api/tour/route/get` - Get current tour route
- `POST /api/tour/route/clear` - Clear tour route
- `GET /api/tour/route/check/<id>` - Check if restaurant is in route

### Chatbot
- `POST /api/chatbot` - Send message to chatbot
- `GET /api/chatbot/stats` - Get chatbot statistics

### Survey & Recommendations
- `POST /api/survey/recommendations` - Get personalized restaurant recommendations

---

## 🎯 Features in Detail

### Restaurant Search
- **Location-based filtering** - Find restaurants within a specified radius
- **Price range filtering** - Filter by budget (low/mid/high)
- **Cuisine filtering** - Filter by Vietnamese, Chinese, Japanese, Korean, Vegetarian, etc.
- **Special requirements** - Filter by dietary restrictions and special flags
- **Opening hours** - Filter restaurants that are currently open
- **Sorting options** - Sort by distance or rating

### AI Chatbot
- **Rule-based responses** - Fast, accurate responses for common queries
- **AI-powered responses** - Uses Ollama for complex, contextual answers
- **Data-driven** - Answers based on actual restaurant and dish data
- **Multi-language support** - Handles Vietnamese and English queries
- **Contextual understanding** - Understands dish information, pricing, recommendations

### Food Survey
- **Dietary preferences** - Vegetarian, vegan, no-pork, no-seafood, no-peanuts
- **Dining vibe** - Street food, casual dining, fine dining
- **Spice tolerance** - No spice, medium spice, bring the heat
- **Cravings** - Soup, dry dishes, rice, crispy, dessert
- **Personalized results** - Returns top 3-5 restaurant recommendations

### Tour Designer
- **Custom route creation** - Add multiple restaurants to your tour
- **Route management** - Add, remove, and clear restaurants
- **Tour navigation** - Navigate through your planned route
- **Tour history** - Save and view previous tours

---

## ⚠️ Known Issues

- **Chatbot**: Has been implemented with both rule-based and AI answers derived from the data given. However, answers are not always consistent (i.e., not matching the intention, etc.)
- **UI Design**: The UI design is a work in progress. Contributions from those with strong design skills are welcome!
- **Button Interactions**: Some buttons may not function as intended (e.g., navigating back to the region selection page instead of the expected region page)

---

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

1. **Report bugs** - Open an issue describing the problem
2. **Suggest features** - Share your ideas for improvements
3. **Improve UI/UX** - Help enhance the design and user experience
4. **Fix issues** - Submit pull requests for bug fixes
5. **Add data** - Contribute restaurant or dish information
6. **Improve documentation** - Help make the docs clearer

### Development Guidelines
- Follow the existing code style
- Test your changes before submitting
- Update documentation if needed
- Be respectful and constructive in discussions

---

## 📝 License

This project is part of a Computational Thinking course at HCMUS (University of Science, Ho Chi Minh City).

---

## 🙏 Acknowledgments

- Vietnamese culinary culture and traditions
- All contributors and testers
- The open-source community

---

**Happy exploring! Enjoy discovering the flavors of Vietnam! 🇻🇳🍜**

