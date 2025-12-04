# 📊 Project Structure Guide

Complete breakdown of the Tourism Project file organization.

---

## 🎯 Design Philosophy

This project follows a **feature-based** architecture with clear separation of concerns:

- **assets/** - All static resources (CSS, JS, Images)
- **pages/** - HTML pages organized by feature
- **data/** - JSON data files
- **docs/** - Documentation
- **config/** - Configuration files

---

## 📁 Detailed Structure

### Root Level
```
index.html              # Main landing page
```

### Assets Directory

#### CSS Organization
```
assets/css/
├── global.css          # Base styles, CSS variables, resets
├── components.css      # Reusable UI components
└── pages/
    ├── landing.css     # Landing page specific styles
    └── region.css      # Region pages specific styles
```

**What goes where:**
- `global.css` - Colors, fonts, base typography, container widths
- `components.css` - Buttons, cards, modals, navigation, footer
- `pages/*.css` - Page-specific layouts and overrides

#### JavaScript Organization
```
assets/js/
├── main.js             # Global utilities, helpers, analytics
├── auth.js             # Authentication system
└── pages/
    ├── landing.js      # Landing page logic
    └── region.js       # Region page logic (dishes, modals)
```

**Dependency Order:**
1. `main.js` - Load first (provides utilities)
2. `auth.js` - Load second (if page needs auth)
3. `pages/*.js` - Load last (page-specific)

#### Images Organization
```
assets/images/
├── hero/               # Large banner images (1920x1080+)
│   ├── landing-hero.jpg
│   └── hcmc-hero.jpg
├── dishes/             # Dish photos (800x600+)
│   ├── pho.jpg
│   ├── com-tam.jpg
│   ├── hu-tieu.jpg
│   └── banh-mi.jpg
├── icons/              # Logo, icons (SVG preferred)
│   └── logo.svg
└── regions/            # City images (1200x800+)
    ├── hanoi.jpg
    ├── hcmc.jpg
    ├── danang.jpg
    └── hue.jpg
```

**Image Guidelines:**
- Use `.jpg` for photos
- Use `.png` for images with transparency
- Use `.svg` for logos and icons
- Optimize images before adding (use TinyPNG, ImageOptim)
- File naming: lowercase, hyphens (e.g., `banh-mi.jpg`)

### Pages Directory
```
pages/
├── regions/
│   ├── hcmc.html       # Ho Chi Minh City (implemented)
│   ├── hanoi.html      # Hanoi (planned)
│   ├── danang.html     # Da Nang (planned)
│   └── hue.html        # Hue (planned)
└── features/
    ├── map.html        # Map view (planned)
    ├── restaurants.html # Restaurant listings (planned)
    └── profile.html    # User profile (planned)
```

### Data Directory
```
data/
├── regions.json        # Region information
├── dishes.json         # Dish database
└── restaurants.json    # Restaurant data (future)
```

**Data Structure Example:**
```json
{
  "id": "unique-id",
  "name": "Display Name",
  "description": "Description text",
  "image": "relative/path/to/image.jpg"
}
```

### Documentation Directory
```
docs/
├── README.md           # Main documentation
├── SETUP.md            # Setup guide
└── STRUCTURE.md        # This file
```

### Config Directory
```
config/
└── config.js           # App configuration (future)
```

---

## 🔗 File Relationships

### HTML → CSS Linking

**From root (`index.html`):**
```html
<link rel="stylesheet" href="assets/css/global.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/pages/landing.css">
```

**From pages (`pages/regions/hcmc.html`):**
```html
<link rel="stylesheet" href="../../assets/css/global.css">
<link rel="stylesheet" href="../../assets/css/components.css">
<link rel="stylesheet" href="../../assets/css/pages/region.css">
```

### HTML → JS Linking

**From root:**
```html
<script src="assets/js/main.js"></script>
<script src="assets/js/pages/landing.js"></script>
```

**From pages:**
```html
<script src="../../assets/js/main.js"></script>
<script src="../../assets/js/auth.js"></script>
<script src="../../assets/js/pages/region.js"></script>
```

### HTML → Images

**From root:**
```html
<img src="assets/images/dishes/pho.jpg" alt="Phở">
```

**From pages:**
```html
<img src="../../assets/images/dishes/pho.jpg" alt="Phở">
```

---

## 📦 Module Dependencies

### JavaScript Module Graph
```
main.js
  ├── Provides: utils, logAnalytics
  └── Used by: all pages

auth.js
  ├── Depends on: main.js
  ├── Provides: login, register, logout
  └── Used by: pages with authentication

pages/landing.js
  ├── Depends on: main.js
  └── Provides: region selection logic

pages/region.js
  ├── Depends on: main.js, auth.js
  └── Provides: dish display, modal logic
```

---

## 🎨 CSS Architecture

### Cascade Order
```
1. global.css       → Base styles, variables
2. components.css   → Component styles
3. pages/*.css      → Page-specific styles
4. Inline styles    → Avoid if possible
```

### CSS Naming Convention
```css
/* Block Element Modifier (BEM) inspired */
.component-name { }           /* Component */
.component-name__element { }  /* Element */
.component-name--modifier { } /* Modifier */

/* Examples */
.dish-card { }
.dish-card__image { }
.dish-card--featured { }
```

---

## 🔄 Data Flow

### User Authentication Flow
```
1. User clicks login
   → openLoginModal() (auth.js)

2. User submits form
   → handleLogin() (auth.js)
   → Validates input
   → Saves to localStorage
   → Updates UI via updateNavigation()

3. Page reload
   → Checks localStorage
   → Auto-updates navigation
```

### Dish Display Flow
```
1. Page loads
   → region.js reads dishesData

2. User clicks dish card
   → openDishModal(dishId)
   → Builds modal HTML
   → Shows modal

3. User closes modal
   → closeDishModal()
   → Removes active class
```

---

## 🚀 Adding New Features

### Adding a New Page

1. **Create HTML file**
   ```
   pages/features/new-feature.html
   ```

2. **Link CSS**
   ```html
   <link href="../../assets/css/global.css">
   <link href="../../assets/css/components.css">
   <link href="../../assets/css/pages/new-feature.css">
   ```

3. **Create page CSS**
   ```
   assets/css/pages/new-feature.css
   ```

4. **Create page JS**
   ```
   assets/js/pages/new-feature.js
   ```

5. **Update navigation**
   Add links in nav menus

### Adding a New Component

1. **Add styles to** `assets/css/components.css`
   ```css
   .new-component {
       /* styles */
   }
   ```

2. **Add JavaScript** (if needed) to `assets/js/main.js`
   ```javascript
   function initNewComponent() {
       // logic
   }
   ```

3. **Use in pages**
   ```html
   <div class="new-component">...</div>
   ```

---

## 📝 Best Practices

### File Naming
- **HTML:** `kebab-case.html` (e.g., `ho-chi-minh.html`)
- **CSS:** `kebab-case.css` (e.g., `landing-page.css`)
- **JS:** `camelCase.js` (e.g., `dishModal.js`) or `kebab-case.js`
- **Images:** `kebab-case.jpg` (e.g., `pho-bo.jpg`)

### Code Organization
- Group related functions together
- Add comments for complex logic
- Keep functions small and focused
- Use consistent formatting

### Asset Optimization
- Compress images before adding
- Minify CSS/JS for production
- Use SVG for logos and icons when possible
- Lazy load images below the fold

---

## 🔍 Finding Things

### "Where do I put...?"

**New styles for a button?**
→ `assets/css/components.css`

**Page-specific layout?**
→ `assets/css/pages/[page-name].css`

**Global helper function?**
→ `assets/js/main.js`

**Authentication code?**
→ `assets/js/auth.js`

**New dish data?**
→ `data/dishes.json`

**Dish images?**
→ `assets/images/dishes/`

**New region page?**
→ `pages/regions/[region-name].html`

---

## 🛠️ Maintenance

### Regular Tasks
- [ ] Optimize images
- [ ] Update documentation
- [ ] Check broken links
- [ ] Test on multiple browsers
- [ ] Clean up unused files
- [ ] Update version numbers

### Before Deployment
- [ ] Minify CSS/JS
- [ ] Compress images
- [ ] Test all features
- [ ] Check responsive design
- [ ] Validate HTML
- [ ] Check console for errors

---

**This structure is designed to scale as the project grows!**

