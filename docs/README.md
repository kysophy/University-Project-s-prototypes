# 🍜 Food Tour Vietnam

> Khám phá ẩm thực Việt Nam - Explore Vietnamese Culinary Culture

A beautiful, interactive web application for discovering Vietnamese cuisine across different regions. Users can explore signature dishes, find restaurants, and plan their culinary tours.

---

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Technologies](#-technologies)
- [Pages](#-pages)
- [Components](#-components)
- [Authentication](#-authentication)
- [Contributing](#-contributing)

---

## ✨ Features

### Current Features
- 🗺️ **Region Selection** - Choose from 4 major Vietnamese regions (Hanoi, HCMC, Da Nang, Hue)
- 🍲 **Dish Explorer** - View detailed information about signature dishes
- 🔐 **User Authentication** - Login/Register system with persistent sessions
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- 🎨 **Modern UI/UX** - Beautiful animations and intuitive interface
- 💾 **Local Storage** - Remembers user preferences and login state

### Planned Features
- 🗺️ Interactive map view with restaurant locations
- ⭐ Restaurant reviews and ratings
- 📍 Custom tour planning
- ❤️ Favorite dishes and restaurants
- 🔍 Advanced search and filtering
- 🌐 Multi-language support

---

## 📁 Project Structure

```
Tourism-Project/
│
├── index.html                      # Landing page (region selection)
│
├── assets/
│   ├── css/
│   │   ├── global.css              # Global styles & CSS variables
│   │   ├── components.css           # Reusable component styles
│   │   └── pages/
│   │       ├── landing.css          # Landing page styles
│   │       └── region.css           # Region page styles
│   │
│   ├── js/
│   │   ├── main.js                  # Global utilities
│   │   ├── auth.js                  # Authentication logic
│   │   └── pages/
│   │       ├── landing.js           # Landing page logic
│   │       └── region.js            # Region page logic
│   │
│   └── images/
│       ├── hero/                    # Hero/banner images
│       ├── dishes/                  # Dish images
│       ├── icons/                   # Icons & logos
│       └── regions/                 # Region city images
│
├── pages/
│   ├── regions/
│   │   └── hcmc.html                # Ho Chi Minh City page
│   └── features/                    # Future feature pages
│
├── data/
│   ├── dishes.json                  # Dish information database
│   └── regions.json                 # Region data
│
├── docs/
│   ├── README.md                    # This file
│   ├── SETUP.md                     # Setup instructions
│   └── STRUCTURE.md                 # Detailed structure guide
│
└── config/
    └── config.js                    # Configuration (future)
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, but recommended)

### Quick Start

1. **Clone or Download the Project**
   ```bash
   git clone [your-repo-url]
   cd Tourism-Project
   ```

2. **Open the Project**
   
   **Option A: Using a Local Server** (Recommended)
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```
   Then open `http://localhost:8000`

   **Option B: Direct File Access**
   Simply double-click `index.html`

3. **Start Exploring!**
   - Select a region (currently Ho Chi Minh City is fully implemented)
   - Click on dishes to view details
   - Try the login/register functionality

---

## 🛠️ Technologies

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Vanilla JavaScript, no frameworks
- **LocalStorage** - Client-side data persistence
- **Google Fonts** - Inter font family

### Why Vanilla JavaScript?
This project uses pure JavaScript without frameworks to:
- Minimize dependencies
- Maximize performance
- Easy to understand and maintain
- Great for learning fundamentals

---

## 📄 Pages

### Landing Page (`index.html`)
The main entry point where users select their region of interest.

**Features:**
- Region cards with images and descriptions
- Smooth animations
- Responsive grid layout
- Region selection modal

### HCMC Page (`pages/regions/hcmc.html`)
Dedicated page for Ho Chi Minh City culinary exploration.

**Features:**
- Hero section with city image
- Featured dish carousel
- Clickable dish cards with detailed modals
- User authentication interface
- Chatbot widget (placeholder)

---

## 🧩 Components

### Reusable Components (in `components.css`)

- **Buttons** - Primary, secondary, and custom styles
- **Cards** - Dish cards, region cards
- **Modals** - Pop-up windows for details and authentication
- **Navigation** - Top nav bar with login/user dropdown
- **Footer** - Site-wide footer
- **Tags** - Color-coded ingredient and flavor tags
- **Notifications** - Toast messages for user feedback

---

## 🔐 Authentication

The authentication system uses browser LocalStorage for demo purposes.

### Features:
- ✅ Login / Register
- ✅ Persistent sessions
- ✅ User dropdown menu
- ✅ Logout functionality
- ✅ Form validation

### Storage:
```javascript
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('currentUser', JSON.stringify({
    username: 'user',
    email: 'user@example.com',
    loginTime: '2025-01-01T00:00:00.000Z'
}));
```

### Future Implementation:
- Connect to backend API
- JWT tokens
- Password hashing
- OAuth integration

---

## 🎨 Styling Guide

### Color Palette
```css
--primary-red: #DC2626
--primary-orange: #EA580C
--text-dark: #1F2937
--text-gray: #6B7280
--white: #FFFFFF
```

### Typography
- **Font Family:** Inter (Google Fonts)
- **Sizes:** Responsive with rem units
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (max-width: 968px) { }
```

---

## 🤝 Contributing

This is a student project for HCMUS. Contributions and suggestions are welcome!

### Development Workflow:
1. Create a new branch for your feature
2. Make your changes
3. Test on multiple browsers
4. Submit a pull request

---

## 📞 Contact

**Project Team:** HCMUS Year 2 - Computational Thinking Class
**Academic Year:** 2024-2025

---

## 📄 License

This project is created for educational purposes.

---

## 🙏 Acknowledgments

- Images from Unsplash
- Icons from Lucide React
- Fonts from Google Fonts
- Inspiration from Vietnamese culinary culture

---

**Made with ❤️ for Vietnamese Food Lovers**

