# English Translation Guide

## Translation Status

This document tracks the English translation of all UI text while preserving Vietnamese content (restaurant names, dish names, addresses).

---

## ✅ Completed Translations

### index.html
- ✅ Page title: "Discover Vietnamese Cuisine"
- ✅ Header subtitle: "Discover Vietnamese Cuisine"
- ✅ Welcome badge: "Welcome"
- ✅ Hero title: "Which region would you like to explore?"
- ✅ Hero description: "Select a region to begin your journey..."
- ✅ Region descriptions (all 4 regions)
- ✅ Start button: "Start Exploring"
- ✅ Selection prompt: "Please select a region to continue"
- ✅ Feature titles: "Culinary Map", "Authentic Reviews", "Personalized Routes"
- ✅ Feature descriptions (all 3)
- ✅ Footer: "Discover the Flavors of Vietnam"

### pages/regions/hcmc.html
- ✅ Page title: "Food Tour Ho Chi Minh City"
- ✅ Navigation: "Content", "Featured Dishes", "About Us"
- ✅ Hero subtitle: "in Ho Chi Minh City"
- ✅ Buttons: "Explore Tours", "Design Your Tour"
- ✅ Section title: "FEATURED DISHES"
- ✅ Section subtitle: "Must Try!"
- ✅ Search button: "Search Restaurants"
- ✅ About section: "About Us", "Content will be added later..."
- ✅ Footer columns: "About Us", "Explore", "Support"
- ✅ Footer links: "Help Center", "FAQs", "Terms of Service", etc.
- ✅ Login modal: "Sign In", "Welcome to Food Tour Vietnam"
- ✅ Form labels: "Username or Email", "Password"
- ✅ Placeholders: "Enter username...", "Enter password..."
- ✅ Buttons: "Sign In", "Sign up now"
- ✅ Toggle text: "Don't have an account?"
- ✅ Account dropdown: "My Account", "Favorite Dishes", "Tour History", "Settings", "Sign Out"

---

## 🔄 Requires Translation (JavaScript Files)

### assets/js/pages/landing.js
```javascript
// Region data descriptions  
hanoi: "The thousand-year-old capital with rich traditional Northern Vietnamese cuisine"
saigon: "A vibrant city with diverse and abundant Southern Vietnamese cuisine"
danang: "A coastal city with fresh seafood and unique Central Vietnamese dishes"
hue: "The ancient capital with refined royal cuisine and distinctive flavors"

// Modal text
"Welcome to" → remains
"Start your food discovery journey" → translation needed
"You have selected" → needs translation
alert messages → need translation
```

### assets/js/pages/tour-designer.js
Needs full translation:
- "Khám Phá Ẩm Thực" → "Explore Cuisine"
- "Tìm kiếm nhà hàng" → "Find restaurants"
- "Tìm món ăn (vd: Phở, Bánh Mì)..." → "Search for food (e.g., Phở, Bánh Mì)..."
- "Tìm kiếm theo tên nhà hàng, món ăn, hoặc địa chỉ" → "Search by restaurant name, food, or address"
- "Nhà hàng" → "Restaurants"
- "nhà hàng" (count) → "restaurants"
- "Lộ trình của bạn" → "Your Route"
- "Xóa tất cả" → "Clear All"
- "Bắt đầu tour" → "Start Tour"
- "Chú thích" → "Legend"
- "Nhà hàng" (legend) → "Restaurant"
- "Đang chọn" → "Selected"
- "Trong lộ trình" → "In Route"
- "Vị trí của bạn" → "Your Location"
- "Xóa khỏi lộ trình" → "Remove from route"
- "➕ Thêm vào lộ trình" → "➕ Add to route"
- "Chỉ Đường" → "Directions"
- "Gọi Điện" → "Call"
- "Đặt Bàn" → "Reserve"
- "Tổng Quan" → "Overview"
- "Đánh Giá" → "Reviews"
- "Nên Thử" → "Must Try"
- "Địa chỉ" → "Address"
- "Điện thoại" → "Phone"
- "Giờ mở cửa" → "Opening Hours"
- "Giá" → "Price"
- "Loại món" → "Cuisine Type"
- "Đang cập nhật" → "Updating..."
- "Mở cửa" → "Open"
- "Đánh giá sẽ được hiển thị ở đây" → "Reviews will be displayed here"
- "Thực đơn sẽ được hiển thị ở đây" → "Menu will be displayed here"
- "Bạn có chắc muốn xóa tất cả nhà hàng khỏi lộ trình?" → "Are you sure you want to remove all restaurants from the route?"
- "Có lỗi xảy ra khi xóa lộ trình!" → "Error clearing route!"
- "Vui lòng thêm ít nhất một nhà hàng vào lộ trình!" → "Please add at least one restaurant to the route!"
- "Không thể thiết lập chỉ đường. Vui lòng thử lại!" → "Unable to set up directions. Please try again!"
- "Không thể tải dữ liệu nhà hàng. Vui lòng kiểm tra server." → "Unable to load restaurant data. Please check the server."
- "GPS access denied. Using default location." → already English
- "Cannot get user location." → already English

### assets/js/pages/tour-navigation.js
Needs translation:
- "Quay lại" → "Back"
- "Bạn đã đến" → "You've arrived at"
- "Đã đến" → "Arrived at"
- "Vui lòng cho phép truy cập GPS." → "Please allow GPS access."
- "Không thể lấy vị trí của bạn." → "Cannot get your location."
- "Lỗi khi cập nhật lộ trình. Vui lòng thử lại." → "Error updating route. Please try again."
- "Tour đã hoàn thành! Cảm ơn bạn đã tham gia." → "Tour completed! Thank you for joining."
- "Không thể tải lộ trình. Vui lòng thử lại." → "Unable to load route. Please try again."

### assets/js/auth.js
Needs translation:
- "Đăng nhập" → "Sign In"
- "Đăng ký" → "Sign Up"
- All alert/error messages

### assets/js/pages/region.js
Needs translation:
- Dish modal content
- Alert messages

---

## 📝 Translation Rules

### ✅ KEEP in Vietnamese:
- Restaurant names (e.g., "Phở Lệ", "Bánh Mì Huynh Hoa")
- Dish names (e.g., "Phở", "Bánh mì", "Cơm tấm", "Hủ tiếu")
- Street names and addresses
- City/region names in Vietnamese (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Huế)
- Cuisine tags in food context (when part of dish name)

### 🔄 TRANSLATE to English:
- All UI labels and buttons
- Navigation items
- Form labels and placeholders
- Error messages and alerts
- Section headings
- Descriptions and instructions
- Footer links
- Modal titles and content
- Tooltips and help text

---

## Translation Pairs Reference

| Vietnamese | English |
|-----------|---------|
| Khám phá | Explore / Discover |
| Tìm kiếm | Search |
| Nhà hàng | Restaurant(s) |
| Món ăn | Dish(es) / Food |
| Lộ trình | Route / Itinerary |
| Chỉ đường | Directions |
| Đánh giá | Reviews / Rating |
| Địa chỉ | Address |
| Giá | Price |
| Giờ mở cửa | Opening Hours |
| Đăng nhập | Sign In |
| Đăng ký | Sign Up |
| Đăng xuất | Sign Out |
| Tài khoản | Account |
| Cài đặt | Settings |
| Hỗ trợ | Support |
| Liên hệ | Contact |
| Về chúng tôi | About Us |
| Chào mừng | Welcome |
| Bắt đầu | Start / Begin |
| Xóa | Delete / Remove / Clear |
| Thêm | Add |
| Quay lại | Back / Return |
| Tiếp tục | Continue |
| Hoàn thành | Complete / Finish |
| Đang cập nhật | Updating... |
| Vui lòng | Please |
| Có lỗi xảy ra | Error occurred |
| Thành công | Success |
| Xác nhận | Confirm |
| Hủy | Cancel |
| Đóng | Close |
| Mở cửa | Open |
| Đã đóng | Closed |
| Phổ biến | Popular |
| Nổi bật | Featured |
| Yêu thích | Favorite |
| Lịch sử | History |
| Tìm kiếm | Search |
| Bộ lọc | Filter |
| Sắp xếp | Sort |
| Khoảng cách | Distance |

---

## Status Summary

- ✅ HTML Pages: 50% Complete (index.html, hcmc.html partially done)
- 🔄 JavaScript Files: 10% Complete (need to translate alert/console messages)
- 🔄 Remaining HTML Pages: search.html, tour-designer.html, tour-navigation.html, signin.html, signup.html, profile.html

---

## Next Steps

1. Update tour-designer.html
2. Update tour-navigation.html  
3. Update search.html
4. Update all JavaScript alert() and console.log() messages
5. Update signin/signup pages
6. Update profile page
7. Test all pages for consistency

---

Last Updated: November 29, 2025

---

Update 1: December 2nd, 2025
Yeah try and translate every possible vietnamese content everything okay?

