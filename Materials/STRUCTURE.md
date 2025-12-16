# 📁 Project Structure — Culinary Compass Vietnam

A web app for discovering Vietnamese cuisine, built with **Flask (Python)** + **vanilla HTML/CSS/JS**.

---

## Directory Overview

```
Full project/
├── app.py              # Main Flask server (routes, APIs, search logic)
├── search_api.py       # Standalone search API module (can run separately)
├── index.html          # Landing page (entry point)
│
├── pages/              # HTML pages
│   ├── signin.html / signup.html      # Authentication
│   ├── profile.html / favorites.html  # User account
│   ├── tour-history.html              # Past tours
│   ├── features/                      # Core features
│   │   ├── food-survey.html           # Food preference quiz
│   │   ├── survey-results.html        # Quiz results
│   │   ├── search.html                # Restaurant search
│   │   ├── tour-designer.html         # Plan a food tour
│   │   └── tour-navigation.html       # Navigate tours (map)
│   └── regions/
│       └── hcmc.html                  # Region-specific page
│
├── assets/
│   ├── css/            # Stylesheets
│   │   ├── global.css              # Base styles, variables
│   │   ├── components.css          # Reusable UI components
│   │   ├── auth.css / profile.css  # Page-specific styles
│   │   └── pages/                  # Feature page styles
│   │
│   ├── js/             # JavaScript
│   │   ├── main.js                 # Shared utilities
│   │   ├── auth.js                 # Auth state management
│   │   ├── signin.js / signup.js   # Auth page logic
│   │   ├── favorites.js / profile.js
│   │   └── pages/                  # Feature page scripts
│   │
│   └── images/         # Static images
│       ├── dishes/         # Dish photos
│       ├── regions/        # Region banners
│       └── restaurants-img/# Restaurant thumbnails
│
├── data/               # JSON data files
│   ├── restaurants.json    # Restaurant list with coords, tags, prices
│   ├── dishes.json         # Dish information
│   └── regions.json        # Region metadata
│
├── config/             # Configuration (empty/reserved)
├── docs/               # Documentation
└── Unfinished_work/    # Pending features & translation guides
```

---

## How Files Connect

```
                          ┌──────────────┐
                          │   index.html │  (Landing Page)
                          └──────┬───────┘
                                 │ links to
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
    ┌──────────┐          ┌───────────┐          ┌───────────┐
    │  pages/  │          │  assets/  │          │   data/   │
    │  *.html  │◄─────────│  js/*.js  │─────────►│   *.json  │
    └──────────┘  uses    └───────────┘ fetches  └───────────┘
                                 │
                                 │ calls API
                                 ▼
                          ┌──────────────┐
                          │    app.py    │  (Flask Backend)
                          │ search_api.py│
                          └──────────────┘
```

| Relationship | Description |
|--------------|-------------|
| `index.html` → `pages/` | Navigation links to feature pages |
| `pages/*.html` → `assets/css/` | Each page imports `global.css` + page-specific CSS |
| `pages/*.html` → `assets/js/` | Each page uses `main.js` + page-specific JS |
| `assets/js/` → `data/*.json` | JS fetches JSON for restaurants, dishes, regions |
| `assets/js/` → `app.py` | JS calls Flask API endpoints (`/api/search`, etc.) |
| `app.py` ← `data/*.json` | Backend loads and processes JSON data |

---

## Quick Start

```bash
# 1. Install dependencies
pip install flask flask-cors

# 2. Start backend
python app.py

# 3. Open index.html in browser (or serve via Flask)
```

---

## Key Features & Their Files

| Feature | HTML | JS | CSS |
|---------|------|----|----|
| **Landing** | `index.html` | `pages/landing.js` | `pages/landing.css` |
| **Search** | `features/search.html` | API via `app.py` | `global.css` |
| **Food Survey** | `features/food-survey.html` | `pages/food-survey.js` | `pages/food-survey.css` |
| **Tour Designer** | `features/tour-designer.html` | `pages/tour-designer.js` | `pages/tour-designer.css` |
| **Tour Navigation** | `features/tour-navigation.html` | `pages/tour-navigation.js` | `pages/tour-navigation.css` |
| **Auth** | `signin.html`, `signup.html` | `signin.js`, `signup.js`, `auth.js` | `auth.css` |
| **Profile** | `profile.html`, `favorites.html` | `profile.js`, `favorites.js` | `profile.css`, `favorites.css` |

---

## Data Schema (Simplified)

**`restaurants.json`**
```json
{
  "id": 1,
  "name": "Phở Lệ",
  "rating": 4.5,
  "averagePrice": 55000,
  "cuisines": ["Vietnamese", "Noodle"],
  "location": { "latitude": 10.7584, "longitude": 106.6690 },
  "openHours": "06:00 - 22:00",
  "address": "413 Nguyễn Trãi, Quận 5, TP.HCM"
}
```

---

## Notes

- **Backend**: `app.py` is the main server; `search_api.py` is a modular version for search-only deployment
- **Styling**: `global.css` has CSS variables; page styles extend components
- **Auth**: Uses localStorage for session state (see `auth.js`)
- **Maps**: Uses OpenStreetMap/Leaflet for tour navigation

