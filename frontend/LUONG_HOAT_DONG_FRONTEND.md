# LUỒNG HOẠT ĐỘNG CHI TIẾT CỦA FRONTEND

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1. Công nghệ sử dụng
- **Framework**: React 18.2.0
- **Routing**: React Router DOM 7.9.3
- **State Management**: React Context API
- **HTTP Client**: Axios 1.12.2
- **UI Libraries**: React Icons, React DatePicker
- **SEO**: React Helmet Async

### 1.2. Cấu trúc thư mục
```
frontend/src/
├── components/          # Các component tái sử dụng
├── pages/              # Các trang chính
├── context/            # Context API (Auth, Cart, Notification)
├── services/           # API services
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── styles/             # CSS global
```

---

## 2. LUỒNG KHỞI TẠO ỨNG DỤNG

### 2.1. Entry Point (`index.js`)
1. **Khởi tạo React Root**
   - Import React và ReactDOM
   - Tạo root bằng `createRoot()`
   - Render component `<App />` với `React.StrictMode`

2. **Load CSS Global**
   - Import `index.css` cho styling toàn cục

### 2.2. Component App (`App.js`)
1. **Setup Context Providers** (theo thứ tự):
   ```javascript
   AuthProvider → CartProvider → NotificationProvider → Router
   ```

2. **Khởi tạo Router**
   - Sử dụng `BrowserRouter` để quản lý routing
   - Định nghĩa các routes cho user và admin

3. **Render Layout Cố định**:
   - `<Header />` - Header với navigation
   - `<main>` - Nội dung động theo route
   - `<Footer />` - Footer
   - `<FloatContact />` - Nút liên hệ nổi
   - `<NotificationContainer />` - Hiển thị thông báo
   - `<Chatbot />` - Chatbot AI

---

## 3. LUỒNG XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)

### 3.1. AuthContext (`context/AuthContext.js`)

**Khởi tạo:**
1. Component mount → Kiểm tra `localStorage`:
   - Tìm `user` và `token`
   - Parse JSON nếu có
   - Set state `user` nếu dữ liệu hợp lệ
   - Clear dữ liệu nếu bị corrupt

**Login Flow:**
```
User nhập thông tin → Gọi apiLogin() 
→ Backend xác thực → Nhận token + user data
→ Lưu vào localStorage (token, user)
→ Update state user
→ Redirect về trang trước hoặc home
```

**Register Flow:**
```
User điền form đăng ký → Gọi apiRegister()
→ Backend tạo tài khoản → Trả về thông báo
→ Redirect đến trang login
```

**Logout Flow:**
```
User click đăng xuất → Gọi logout()
→ Xóa localStorage (token, user)
→ Clear state user
→ Redirect về trang chủ
```

### 3.2. API Interceptor (`services/api.js`)

**Request Interceptor:**
- Tự động thêm `Authorization: Bearer {token}` vào header
- Lấy token từ `localStorage` (hỗ trợ cả `token` và `accessToken`)
- Log request để debug

**Response Interceptor:**
- Xử lý lỗi tự động:
  - **401**: Xóa token, redirect đến `/login`
  - **403**: Hiển thị thông báo không có quyền
  - **404**: Thông báo không tìm thấy
  - **422**: Hiển thị lỗi validation
  - **500**: Thông báo lỗi server
- Tính toán thời gian request để monitoring

---

## 4. LUỒNG QUẢN LÝ GIỎ HÀNG (CART)

### 4.1. CartContext (`context/CartContext.js`)

**Khởi tạo:**
1. Component mount → Load cart từ `localStorage`
2. Parse JSON và validate dữ liệu
3. Set state `cart` nếu hợp lệ

**Auto-save:**
- Mỗi khi `cart` thay đổi → Tự động lưu vào `localStorage`

**Add to Cart:**
```
User click "Thêm vào giỏ" → addToCart(product, quantity)
→ Kiểm tra sản phẩm đã có trong cart chưa
  ├─ Nếu có: Tăng quantity (kiểm tra stock)
  └─ Nếu chưa: Thêm sản phẩm mới (kiểm tra stock)
→ Update state cart → Auto-save localStorage
→ Hiển thị notification thành công
```

**Update Quantity:**
```
User thay đổi số lượng → updateQuantity(productId, newQuantity)
→ Validate quantity (>= 0, <= stock)
→ Nếu quantity = 0 → removeFromCart()
→ Update state cart → Auto-save
```

**Remove from Cart:**
```
User click xóa → removeFromCart(productId)
→ Filter cart để loại bỏ sản phẩm
→ Update state → Auto-save
```

**Tính toán:**
- `getTotalItems()`: Tổng số lượng sản phẩm
- `getTotalPrice()`: Tổng giá trị
- `getFormattedTotal()`: Format giá theo VND

---

## 5. LUỒNG TRANG CHỦ (HOMEPAGE)

### 5.1. HomePage (`pages/HomePage.new.js`)

**Khởi tạo:**
1. Component mount → Scroll lên đầu trang
2. Gọi `loadFeaturedProducts()`:
   - Set `loading = true`
   - Gọi API `getFeaturedProducts(8)`
   - Set state `products`
   - Set `loading = false`

**Render:**
1. **Hero Section**: Banner với CTA "Mua sắm ngay"
2. **Featured Products Section**:
   - Hiển thị loading skeleton nếu đang tải
   - Hiển thị error message nếu có lỗi
   - Hiển thị empty state nếu không có sản phẩm
   - Render grid 8 sản phẩm nổi bật
   - Link "Xem tất cả sản phẩm" → `/products`

**SEO:**
- Sử dụng React Helmet để set meta tags
- Title, description, OG tags cho social sharing

---

## 6. LUỒNG DANH SÁCH SẢN PHẨM (PRODUCT LIST)

### 6.1. ProductList (`pages/ProductList.js`)

**Khởi tạo:**
1. Đọc URL params (`searchParams`):
   - `search`: Từ khóa tìm kiếm
   - `category`: ID danh mục
   - `type`: Loại sản phẩm (sub-category)
   - `sort`: Cách sắp xếp
   - `page`: Trang hiện tại

2. Sync state với URL params:
   - `searchTerm` ← `search` param
   - `selectedCategory` ← `category` param
   - `selectedType` ← `type` param
   - `sortBy` ← `sort` param

**Live Search (Header Integration):**
- Lắng nghe event `header:search` khi user gõ ở header
- Update `searchTerm` ngay lập tức (không cần submit)
- Debounce 500ms trước khi filter

**Category Hover:**
- Lắng nghe event `header:hoverCategory` khi hover menu
- Update `selectedCategory` và URL ngay lập tức
- Không cần click, chỉ cần hover

**Filter Flow:**
```
User thay đổi filter → Update state
→ Debounce search (500ms)
→ Gọi useProducts hook với filters
→ Hook gọi API với query params
→ Nhận products từ API
→ Filter client-side nếu cần (type, fuzzy match)
→ Render products grid
→ Update URL params để sync
```

**Pagination:**
- Mỗi trang hiển thị 12 sản phẩm
- URL param `page` để track trang hiện tại
- Scroll lên đầu khi đổi trang

**Fallback Logic:**
- Nếu filter theo `type` không có kết quả:
  1. Thử fuzzy match (tìm theo tên)
  2. Nếu vẫn không có → Hiển thị tất cả sản phẩm trong category
  3. Hiển thị banner thông báo fallback

**useProducts Hook:**
- Quản lý state: products, loading, error, pagination
- Methods: `handleSearch`, `handleCategoryFilter`, `handleTypeFilter`, `handleSort`, `goToPage`
- Tự động gọi API khi filters thay đổi

---

## 7. LUỒNG CHI TIẾT SẢN PHẨM (PRODUCT DETAIL)

### 7.1. ProductDetail (`pages/ProductDetail.js`)

**Khởi tạo:**
1. Lấy `id` từ URL params
2. Parse ID nếu có slug (VD: `hoa-sinh-nhat-123` → `123`)
3. Gọi `getProductById(id)`:
   - Set `loading = true`
   - Gọi API `/products/:id`
   - Set state `product`
   - Set `loading = false`

**Add to Cart:**
```
User chọn số lượng → Click "Thêm vào giỏ"
→ Validate:
  ├─ Kiểm tra stock > 0
  └─ Kiểm tra quantity <= stock
→ Gọi addToCart(product, quantity)
→ Hiển thị notification thành công
```

**Image Gallery:**
- Hiển thị ảnh chính và thumbnails
- Click thumbnail → Đổi ảnh chính
- Fallback placeholder nếu ảnh lỗi

**SEO:**
- Meta tags đầy đủ (title, description, OG tags)
- Structured data (JSON-LD) cho Google
- Canonical URL

---

## 8. LUỒNG GIỎ HÀNG (CART PAGE)

### 8.1. CartPage (`pages/CartPage.js`)

**Render:**
1. **Empty State**: Nếu cart rỗng → Hiển thị thông báo + button "Tiếp tục mua sắm"

2. **Cart Items**:
   - Map qua `cart` từ CartContext
   - Mỗi item hiển thị:
     - Ảnh sản phẩm
     - Tên và giá
     - Quantity controls (+/-)
     - Tổng giá (price × quantity)
     - Button xóa

3. **Cart Summary**:
   - Tạm tính (tổng giá)
   - Phí vận chuyển (miễn phí)
   - Tổng cộng
   - Button "Thanh toán" → `/checkout`
   - Button "Xóa toàn bộ giỏ hàng"
   - Link "Tiếp tục mua sắm"

**Quantity Update:**
- Click +/- hoặc nhập trực tiếp
- Validate: min = 1, max = stock
- Auto-update tổng giá

---

## 9. LUỒNG THANH TOÁN (CHECKOUT)

### 9.1. CheckoutPage (`pages/CheckoutPage.js`)

**Validation:**
- **Bắt buộc**: fullName, phone, address, city, district, receiverName, receiverPhone, deliveryTime
- **Tùy chọn**: notes
- Validate format phone (10-11 số)

**Submit Order Flow:**
```
User điền form → Click "Đặt hàng"
→ Validate form
  ├─ Nếu lỗi → Hiển thị error message
  └─ Nếu hợp lệ → Tiếp tục
→ Kiểm tra user đã đăng nhập
  ├─ Chưa đăng nhập → Redirect /login
  └─ Đã đăng nhập → Tiếp tục
→ Build payload:
  ├─ items: [product_id, quantity, price]
  ├─ customer_info: {full_name, phone, address, ...}
  ├─ delivery_time: datetime string
  ├─ payment_method: 'cod'
  └─ total_amount: getCartTotal()
→ Gọi API POST /orders
→ Nhận order_id từ response
→ Hiển thị OrderModal với thông tin đơn hàng
→ Dispatch event 'orders:refresh' để header cập nhật
→ Clear cart khi user đóng modal
→ Redirect đến trang success
```

**OrderModal:**
- Hiển thị thông tin đơn hàng vừa tạo
- Mã đơn hàng, tổng tiền, thông tin giao hàng
- User đóng modal → Clear cart → Hiển thị success page

**Success Page:**
- Thông báo "Đặt hàng thành công"
- Button "Quay về trang chủ"

---

## 10. LUỒNG HEADER VÀ NAVIGATION

### 10.1. Header (`components/Header.js`)

**Responsive:**
- Desktop: Full navigation bar
- Mobile: Hamburger menu với overlay

**Search Functionality:**
1. **Desktop Search Bar**:
   - Input với debounce 350ms
   - Gõ → Dispatch event `header:search` (live update ProductList)
   - Submit → Navigate đến `/products?search=...`

2. **Mobile Search**:
   - Trong overlay menu
   - Tương tự desktop nhưng trong modal

**Category Navigation:**
- Hover category → Dispatch event `header:hoverCategory`
- ProductList lắng nghe và update ngay lập tức
- Click → Navigate đến `/products?category=...`

**User Menu:**
- Nếu chưa đăng nhập: Hiển thị "Đăng nhập" / "Đăng ký"
- Nếu đã đăng nhập:
  - Hiển thị username
  - Dropdown "Đơn hàng gần đây":
    - Lazy load khi mở dropdown
    - Gọi API `/orders/my-orders?limit=5`
    - Hiển thị 5 đơn hàng gần nhất
    - Link "Xem tất cả đơn hàng"
  - Button "Đăng xuất"

**Cart Badge:**
- Hiển thị số lượng sản phẩm trong cart
- Real-time update khi cart thay đổi

**Orders Refresh:**
- Lắng nghe event `orders:refresh` (sau khi đặt hàng)
- Tự động reload danh sách đơn hàng trong dropdown

---

## 11. LUỒNG API SERVICES

### 11.1. Product Service (`services/productService.js`)

**getAllProducts(params):**
- Query params: page, limit, search, category, sortBy, sortOrder
- Normalize response để đảm bảo format nhất quán
- Merge client-side overrides nếu có (temporary workaround)

**getProductById(id):**
- Gọi API `/products/:id`
- Normalize product data
- Merge overrides nếu có

**getFeaturedProducts(limit):**
- Gọi API `/products/featured?limit=...`
- Fallback: Gọi getAllProducts với sort mới nhất

**getProductsByCategory(categoryId):**
- Wrapper của getAllProducts với category filter

**searchProducts(query):**
- Wrapper của getAllProducts với search param

### 11.2. Order Service (`services/orderService.js`)

**createOrder(orderData):**
- POST `/orders` với payload đầy đủ
- Trả về order_id

**getUserOrders(params):**
- GET `/orders/my-orders` với pagination, filters
- Trả về {orders, pagination, total}

**getOrderById(orderId):**
- GET `/orders/:id`
- Trả về chi tiết đơn hàng

**formatOrderForDisplay(order):**
- Format date, amount, status
- Thêm statusInfo với màu sắc

---

## 12. LUỒNG NOTIFICATION

### 12.1. NotificationContext (`context/NotificationContext.js`)

**Show Notification:**
```
showSuccess(message) / showError(message) / showWarning(message)
→ Tạo notification object với type, message, id
→ Add vào notifications array
→ Auto-remove sau 5 giây
```

**Render:**
- NotificationContainer render ở App level
- Hiển thị stack notifications ở góc màn hình
- Animation slide in/out

---

## 13. LUỒNG ADMIN (Nếu có quyền admin)

### 13.1. Admin Routes
- `/admin` - Dashboard
- `/admin/products` - Quản lý sản phẩm
- `/admin/products/new` - Tạo sản phẩm mới
- `/admin/products/:id/edit` - Sửa sản phẩm
- `/admin/orders` - Quản lý đơn hàng
- `/admin/customers` - Quản lý khách hàng

**Protection:**
- AdminLayout kiểm tra `user.role === 'admin'`
- Nếu không phải admin → Redirect về home

---

## 14. LUỒNG XỬ LÝ LỖI

### 14.1. API Errors
- Interceptor tự động xử lý:
  - 401: Clear auth, redirect login
  - 403: Thông báo không có quyền
  - 404: Thông báo không tìm thấy
  - 422: Hiển thị validation errors
  - 500: Thông báo lỗi server
  - Network error: Thông báo không kết nối được

### 14.2. Component Errors
- Try-catch trong async functions
- Hiển thị error state trong UI
- Fallback UI khi có lỗi

---

## 15. LUỒNG SEO VÀ META TAGS

### 15.1. React Helmet
- Mỗi page set title, description riêng
- OG tags cho social sharing
- Canonical URLs
- Structured data (JSON-LD) cho sản phẩm

### 15.2. Sitemap
- Script generate sitemap tự động
- Include tất cả routes và products

---

## 16. LUỒNG PERFORMANCE OPTIMIZATION

### 16.1. Code Splitting
- React Router lazy loading (nếu có)
- Dynamic imports cho heavy components

### 16.2. Debouncing
- Search input: 500ms
- Header search: 350ms
- URL updates: 120ms

### 16.3. Caching
- localStorage cho cart, user data
- API responses có thể cache (tùy implementation)

### 16.4. Image Optimization
- Lazy loading images
- Placeholder khi load
- Error fallback

---

## 17. LUỒNG TƯƠNG TÁC VỚI BACKEND

### 17.1. API Base URL
- Development: `http://localhost:5000/api`
- Production: Từ `REACT_APP_API_URL` env variable

### 17.2. Request Flow
```
Component → Service → api.js (axios) → Backend
                ↓
         Interceptor (add token)
                ↓
         Backend API
                ↓
         Interceptor (handle errors)
                ↓
         Service (normalize data)
                ↓
         Component (update state)
```

### 17.3. Authentication
- Token được lưu trong localStorage
- Tự động thêm vào header mỗi request
- Auto-logout nếu token hết hạn (401)

---

## 18. TỔNG KẾT LUỒNG CHÍNH

### 18.1. User Journey
```
1. Truy cập trang chủ
   → Xem sản phẩm nổi bật
   → Click "Xem tất cả" → ProductList

2. Tìm kiếm / Lọc sản phẩm
   → Gõ search hoặc chọn category
   → Xem danh sách sản phẩm
   → Click sản phẩm → ProductDetail

3. Thêm vào giỏ hàng
   → Chọn số lượng
   → Click "Thêm vào giỏ"
   → CartContext update
   → Notification hiển thị

4. Xem giỏ hàng
   → CartPage
   → Chỉnh sửa số lượng
   → Click "Thanh toán" → CheckoutPage

5. Đặt hàng
   → Điền thông tin giao hàng
   → Chọn ngày giờ nhận hàng
   → Submit order
   → API tạo đơn hàng
   → Hiển thị OrderModal
   → Success page

6. Xem đơn hàng
   → Header dropdown "Đơn hàng gần đây"
   → Xem chi tiết đơn hàng
```

### 18.2. Data Flow
```
User Action
    ↓
Component Event Handler
    ↓
Context / Service
    ↓
API Call (với token)
    ↓
Backend Response
    ↓
Normalize Data
    ↓
Update State
    ↓
Re-render UI
    ↓
User sees result
```

---

## 19. CÁC TÍNH NĂNG ĐẶC BIỆT

### 19.1. Live Search
- Gõ ở header → ProductList update ngay (không cần submit)
- Debounce để tránh quá nhiều requests

### 19.2. Category Hover
- Hover menu → ProductList update category ngay
- Không cần click

### 19.3. Cart Persistence
- Cart lưu trong localStorage
- Tự động restore khi reload trang

### 19.4. Order Refresh
- Sau khi đặt hàng → Event `orders:refresh`
- Header tự động reload danh sách đơn hàng

### 19.5. Fuzzy Matching
- Nếu filter theo type không có kết quả
- Tự động tìm fuzzy match theo tên
- Fallback về category nếu vẫn không có

---

## 20. CÁC FILE QUAN TRỌNG

### 20.1. Core Files
- `App.js` - Entry component, routing
- `index.js` - React root
- `services/api.js` - Axios config, interceptors
- `context/AuthContext.js` - Authentication state
- `context/CartContext.js` - Cart state
- `context/NotificationContext.js` - Notifications

### 20.2. Page Components
- `pages/HomePage.new.js` - Trang chủ
- `pages/ProductList.js` - Danh sách sản phẩm
- `pages/ProductDetail.js` - Chi tiết sản phẩm
- `pages/CartPage.js` - Giỏ hàng
- `pages/CheckoutPage.js` - Thanh toán

### 20.3. Service Files
- `services/productService.js` - Product API
- `services/orderService.js` - Order API
- `services/authService.js` - Auth API

### 20.4. Utility Files
- `utils/formatPrice.js` - Format giá VND
- `utils/normalizeString.js` - Normalize string cho search
- `utils/normalizeType.js` - Normalize type param

---

**Tài liệu này mô tả chi tiết toàn bộ luồng hoạt động của frontend, từ khởi tạo ứng dụng đến các tương tác của người dùng và xử lý dữ liệu.**

