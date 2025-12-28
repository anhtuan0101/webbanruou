import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getUserOrders, formatOrderForDisplay } from '../services/orderService';
import { CartContext } from '../context/CartContext';
import './Header.css';
import logo from '../assets/LOGO.png';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openAccordion, setOpenAccordion] = useState(null);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const searchDebounceRef = useRef(null);
  const isComposingRef = useRef(false);
  const ordersMenuRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOverlayOpen]);

  // Handlers
  const toggleOverlay = useCallback(() => {
    setIsOverlayOpen(prev => !prev);
    setOpenAccordion(null);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOverlayOpen(false);
    setOpenAccordion(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    closeMenu();
  }, [logout, closeMenu]);

  // Fetch recent user orders when opening the orders menu (only for authenticated users)
  const toggleOrdersMenu = useCallback(async () => {
    setOrdersMenuOpen(prev => !prev);
    // If opening and we don't have orders yet, fetch them
    if (!ordersMenuOpen && !orders && user) {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await getUserOrders({ limit: 5, sortBy: 'order_date', sortOrder: 'desc' });
        const list = res.orders || res;
        const formatted = (list || []).map(o => formatOrderForDisplay(o));
        setOrders(formatted);
      } catch (err) {
        setOrdersError(err?.userMessage || err.message || 'Không thể tải đơn hàng');
      } finally {
        setOrdersLoading(false);
      }
    }
  }, [ordersMenuOpen, orders, user]);

  // Close orders menu on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (ordersMenuRef.current && !ordersMenuRef.current.contains(e.target)) {
        setOrdersMenuOpen(false);
      }
    }
    if (ordersMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [ordersMenuOpen]);

  // Listen for global "orders:refresh" events (e.g. after placing an order)
  // and refresh the orders list in the header so users see newly created orders.
  useEffect(() => {
    let mounted = true;
    const handleRefresh = async () => {
      if (!user) return;
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await getUserOrders({ limit: 5, sortBy: 'order_date', sortOrder: 'desc' });
        const list = res.orders || res;
        const formatted = (list || []).map(o => formatOrderForDisplay(o));
        if (mounted) setOrders(formatted);
      } catch (err) {
        if (mounted) setOrdersError(err?.userMessage || err.message || 'Không thể tải đơn hàng');
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };

    window.addEventListener('orders:refresh', handleRefresh);
    return () => {
      mounted = false;
      window.removeEventListener('orders:refresh', handleRefresh);
    };
  }, [user]);

  const toggleAccordion = useCallback((id) => {
    setOpenAccordion(prev => prev === id ? null : id);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // Ensure we use the very latest input value (read from the form) and
    // cancel any pending debounced URL updates so they don't overwrite the
    // navigation triggered by this submit.
    let val = search;
    try {
      const form = e.currentTarget || e.target;
      const input = form.querySelector && (form.querySelector('.search-input-main') || form.querySelector('.search-input'));
      if (input && typeof input.value === 'string') {
        val = input.value;
      }
    } catch (err) {
      // fallback to state 'search'
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    if (val && val.trim()) {
      navigate(`/products?search=${encodeURIComponent(val.trim())}`);
      closeMenu();
    } else {
      // If empty, navigate to products without search param
      navigate('/products');
      closeMenu();
    }
  }, [search, navigate, closeMenu]);

  // Keep header search input in sync with URL `search` param so that
  // - before Enter: user sees what they typed
  // - after Enter (navigation to /products?search=...): header shows the search term from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    // Only sync from URL when:
    // - we're on the products page (so other pages don't overwrite)
    // - and the search input is not currently focused (avoid clobbering while typing)
    try {
      const isProductsPage = location.pathname.startsWith('/products');
      const active = document.activeElement;
      const inputFocused = active && (active.classList && (active.classList.contains('search-input-main') || active.classList.contains('search-input')));
      if (isProductsPage && !inputFocused && q !== search) {
        setSearch(q);
      }
    } catch (e) {
      if (q !== search) setSearch(q);
    }
  }, [location.search]);

  // Helper: schedule updating the URL `search` param (debounced)
  const scheduleUpdateUrl = (value) => {
    if (!location.pathname.startsWith('/products')) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      // Only notify ProductList of the typed value via an event. Do NOT
      // modify the URL while typing — changing the URL can affect
      // `searchParams` and cause category/type state to flicker.
      try {
        window.dispatchEvent(new CustomEvent('header:search', { detail: { value } }));
      } catch (err) {
        const ev = document.createEvent('CustomEvent');
        ev.initCustomEvent('header:search', true, true, { value });
        window.dispatchEvent(ev);
      }
    }, 350);
  };

  // Helpers
  const isActive = (path) => location.pathname === path;
  const getTotalItems = () => cart.reduce((total, item) => total + (item.quantity || 1), 0);

  // Dispatch a hover category event so ProductList can update on hover
  const dispatchHoverCategory = (categoryId) => {
    try {
      window.dispatchEvent(new CustomEvent('header:hoverCategory', { detail: { category: String(categoryId) } }));
    } catch (err) {
      const ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('header:hoverCategory', true, true, { category: String(categoryId) });
      window.dispatchEvent(ev);
    }
  };

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="header-top-bar">
        <div className="header-top-container">
          {/* Logo */}
          <Link to="/" className="header-logo" onClick={closeMenu}>
            <img src={logo} alt="Oanh Fruits & Flowers Logo" className="logo-img" />
            <div className="logo-text-wrapper">
              <span className="logo-text-main">RuouSiGiaTot</span>
              <span className="logo-text-sub">Chuyên cung cấp các loại rượu</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          {!isMobile && (
            <form className="header-search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                className="search-input-main"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={(e) => {
                  isComposingRef.current = false;
                  const v = e.target.value;
                  setSearch(v);
                  // composition finished — do an update
                  scheduleUpdateUrl(v);
                }}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearch(v);
                  // Only schedule URL updates when not composing (IME)
                  if (!isComposingRef.current) scheduleUpdateUrl(v);
                }}
              />
              <button type="submit" className="search-btn-main">
                🔍
              </button>
            </form>
          )}

          {/* Right Icons */}
          <div className="header-top-right">
            {/* Hotline */}
            <a 
              href="https://zalo.me/0335254586" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="header-hotline"
            >
              <span className="hotline-label">Hotline:</span>
              <span className="hotline-number">03352545861</span>
            </a>

            {/* Cart */}
            <Link to="/cart" className="header-cart-icon">
              <span className="cart-icon-main">🛒</span>
              {getTotalItems() > 0 && <span className="cart-badge-main">{getTotalItems()}</span>}
            </Link>

            {/* Auth Links - Desktop */}
            {!isMobile && (
              <div className="header-top-auth">
                {!user ? (
                  <>
                    <Link to="/login" className="top-auth-link">
                      Đăng nhập
                    </Link>
                    <span className="top-auth-divider">|</span>
                    <Link to="/register" className="top-auth-link">
                      Đăng ký
                    </Link>
                  </>
                ) : (
                  <div className="top-user-menu" ref={ordersMenuRef}>
                    <button className="top-username orders-toggle" onClick={toggleOrdersMenu} aria-haspopup="true" aria-expanded={ordersMenuOpen}>
                      👋 Hi, {user.username}
                    </button>

                    <button className="top-logout-btn" onClick={handleLogout}>
                      Đăng xuất
                    </button>

                    {/* Orders dropdown (desktop) */}
                    {ordersMenuOpen && (
                      <div className="orders-dropdown" role="menu">
                        <div className="orders-dropdown-header">Đơn hàng gần đây</div>
                        {ordersLoading && <div className="orders-loading">Đang tải...</div>}
                        {ordersError && <div className="orders-error">{ordersError}</div>}
                        {!ordersLoading && !ordersError && (!orders || orders.length === 0) && (
                          <div className="orders-empty">Bạn chưa có đơn hàng nào. <br />Mua hàng ngay để lưu lịch sử khi đã đăng nhập.</div>
                        )}
                        {!ordersLoading && orders && orders.length > 0 && (
                          <ul className="orders-list">
                            {orders.map(o => (
                              <li key={o.id || o._id} className="orders-item">
                                <a href={`/orders/${o.id || o._id}`} onClick={() => setOrdersMenuOpen(false)}>
                                  <div className="orders-item-top">
                                    <span className="orders-item-id">#{o.id || o._id}</span>
                                    <span className="orders-item-amount">{o.formattedAmount}</span>
                                  </div>
                                  <div className="orders-item-meta">
                                    <span className="orders-item-date">{o.formattedDate}</span>
                                    <span className="orders-item-status">{o.statusInfo?.label}</span>
                                  </div>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="orders-dropdown-footer">
                          <Link to="/orders" onClick={() => setOrdersMenuOpen(false)}>Xem tất cả đơn hàng</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button 
                className={`mobile-menu-btn ${isOverlayOpen ? 'active' : ''}`} 
                onClick={toggleOverlay}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      {!isMobile && (
        <DesktopNav 
          user={user}
          isActive={isActive}
          closeMenu={closeMenu}
          handleLogout={handleLogout}
          dispatchHoverCategory={dispatchHoverCategory}
        />
      )}

      {/* Mobile Overlay */}
      {isMobile && isOverlayOpen && (
        <MobileOverlay 
          user={user}
          openAccordion={openAccordion}
          toggleAccordion={toggleAccordion}
          closeMenu={closeMenu}
          handleLogout={handleLogout}
          getTotalItems={getTotalItems}
          isActive={isActive}
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          isComposingRef={isComposingRef}
          scheduleUpdateUrl={scheduleUpdateUrl}
        />
      )}
    </header>
  );
}

// Desktop Navigation Component
function DesktopNav({ user, isActive, closeMenu, handleLogout, dispatchHoverCategory }) {
  return (
    <nav className="header-nav-bar">
      <div className="nav-container">
        <div className="nav-links-main">
          {/* Home */}
          <Link to="/" className={`nav-link-item ${isActive('/') ? 'active' : ''}`}>
            Trang Chủ
          </Link>

          {/* Imported Fruits */}
      <Link to="/products?category=1" className={`nav-link-item ${isActive('/products?category=1') ? 'active' : ''}`} onClick={() => dispatchHoverCategory(1)}>
        Rượu Vang
          </Link>

          {/* Vietnamese Fruits */}
          <Link to="/products?category=5" className={`nav-link-item ${isActive('/products?category=5') ? 'active' : ''}`} onClick={() => dispatchHoverCategory(5)}>
            Rượu Việt Nam
          </Link>

          {/* Fresh Flowers Dropdown */}
          <div className="nav-dropdown-wrapper">
            <Link to="/products?category=3" className="nav-link-item dropdown-trigger" onClick={() => dispatchHoverCategory(3)}>
              Rượu Nhập Khẩu <span className="arrow">▼</span>
            </Link>
            <div className="nav-dropdown-menu">
              <Link to="/products?category=3" className="dropdown-link" onClick={closeMenu}>
                Tất Cả Rượu Khác
              </Link>
              <Link to="/products?category=3&type=ke-chuc-mung" className="dropdown-link" onClick={closeMenu}>
                Rượu Hàn
              </Link>
              <Link to="/products?category=3&type=ke-vieng" className="dropdown-link" onClick={closeMenu}>
                Rượu Nhật
              </Link>
              <Link to="/products?category=3&type=bo-chuc-mung" className="dropdown-link" onClick={closeMenu}>
                Rượu Mỹ
              </Link>
              <Link to="/products?category=3&type=bo-vieng" className="dropdown-link" onClick={closeMenu}>
                Rượu CaNaDa
              </Link>
            </div>
          </div>

          {/* Fruit Baskets Dropdown */}
          <div className="nav-dropdown-wrapper">
            <Link to="/products?category=2" className="nav-link-item dropdown-trigger" onClick={() => dispatchHoverCategory(2)}>
              Hộp quà rượu tết<span className="arrow">▼</span>
            </Link>
            <div className="nav-dropdown-menu">
              <Link to="/products?category=2" className="dropdown-link" onClick={closeMenu}>
                  Tất cả giỏ quà
                </Link>
                <Link to="/products?category=2&type=sinh-nhat" className="dropdown-link" onClick={closeMenu}>
                  Hộp quà rượu vang tết
                </Link>
                <Link to="/products?category=2&type=cuoi-hoi" className="dropdown-link" onClick={closeMenu}>
                  Hộp quà rượu mạnh tết
                </Link>
                <Link to="/products?category=2&type=tan-gia" className="dropdown-link" onClick={closeMenu}>
                  Rượu linh vật
                </Link>
                <Link to="/products?category=2&type=vieng" className="dropdown-link" onClick={closeMenu}>
                  Hộp quà rượu linh chi
                </Link>
            </div>
          </div>

          {/* Admin Link */}
          {user?.role === 'admin' && (
            <Link to="/admin/products" className={`nav-link-item ${isActive('/admin/products') ? 'active' : ''}`}>
              Quản lý
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// Mobile Overlay Component
function MobileOverlay({ user, openAccordion, toggleAccordion, closeMenu, handleLogout, getTotalItems, isActive, search, setSearch, handleSearch, isComposingRef, scheduleUpdateUrl }) {
  return (
    <div className="mobile-overlay" role="dialog" aria-modal="true">
      <div className="overlay-header">
        <Link to="/" className="header-logo" onClick={closeMenu}>
          <img src={logo} alt="Oanh Fruits & Flowers" className="logo-img" />
          <div className="logo-text-wrapper">
            <span className="logo-text-main">Oanh Fruits & Flowers</span>
            <span className="logo-text-sub">Chuyên hàng nhập khẩu</span>
          </div>
        </Link>
        <button className="overlay-close" onClick={closeMenu}>
          ✕
        </button>
      </div>

      {/* Search in mobile */}
      <div className="mobile-search-wrapper">
        <form className="mobile-search" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              const v = e.target.value;
              setSearch(v);
              scheduleUpdateUrl(v);
            }}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              if (!isComposingRef.current) scheduleUpdateUrl(v);
            }}
          />
          <button type="submit" className="search-btn">
            🔍
          </button>
        </form>
      </div>

      <div className="menu-list">
        {/* Home */}
        <div className="menu-item">
          <Link to="/" className="menu-link" onClick={closeMenu}>
            🏠 Trang Chủ
          </Link>
        </div>

        {/* Imported Fruits */}
        <div className="menu-item">
          <Link to="/products?category=1" className="menu-link" onClick={closeMenu}>
            🍎 Trái cây nhập khẩu
          </Link>
        </div>

        {/* Vietnamese Fruits */}
        <div className="menu-item">
          <Link to="/products?category=5" className="menu-link" onClick={closeMenu}>
            🍊 Trái cây Việt Nam
          </Link>
        </div>

        {/* Fresh Flowers Accordion */}
        <div className="menu-item overlay-accordion">
          <button 
            className={`accordion-toggle ${openAccordion === 'flowers' ? 'open' : ''}`} 
            onClick={() => toggleAccordion('flowers')}
          >
            💐 Hoa tươi <span className="chev">▸</span>
          </button>
          <div className={`panel ${openAccordion === 'flowers' ? 'open' : ''}`}>
            <Link to="/products?category=3" onClick={closeMenu}>
              Tất cả hoa tươi
            </Link>
            <Link to="/products?category=3&type=ke-chuc-mung" onClick={closeMenu}>
              🎉 Kệ hoa chúc mừng
            </Link>
            <Link to="/products?category=3&type=ke-vieng" onClick={closeMenu}>
              🕯️ Kệ hoa kính viếng
            </Link>
            <Link to="/products?category=3&type=bo-chuc-mung" onClick={closeMenu}>
              🎊 Bó hoa chúc mừng
            </Link>
            <Link to="/products?category=3&type=bo-vieng" onClick={closeMenu}>
              💐 Bó hoa kính viếng
            </Link>
          </div>
        </div>

        {/* Fruit Baskets Accordion */}
        <div className="menu-item overlay-accordion">
          <button 
            className={`accordion-toggle ${openAccordion === 'baskets' ? 'open' : ''}`} 
            onClick={() => toggleAccordion('baskets')}
          >
            🧺 Giỏ quà trái cây <span className="chev">▸</span>
          </button>
          <div className={`panel ${openAccordion === 'baskets' ? 'open' : ''}`}>
            <Link to="/products?category=2" onClick={closeMenu}>
              Tất cả giỏ quà
            </Link>
            <Link to="/products?category=1&type=sinh-nhat" onClick={closeMenu}>
              🎂 Giỏ sinh nhật
            </Link>
            <Link to="/products?category=1&type=cuoi-hoi" onClick={closeMenu}>
              💐 Giỏ cưới hỏi
            </Link>
            <Link to="/products?category=1&type=tan-gia" onClick={closeMenu}>
              🏡 Giỏ tân gia
            </Link>
            <Link to="/products?category=1&type=vieng" onClick={closeMenu}>
              🕯️ Giỏ viếng
            </Link>
          </div>
        </div>

        {/* Admin Link */}
        {user?.role === 'admin' && (
          <div className="menu-item">
            <Link to="/admin/products" className="menu-link admin-menu-link" onClick={closeMenu}>
              ⚙️ Quản lý sản phẩm
            </Link>
          </div>
        )}

        {/* Divider */}
        <div className="menu-divider"></div>

        {/* Contact */}
        <div className="menu-item">
          <a href="https://zalo.me/0335254586" target="_blank" rel="noopener noreferrer" className="menu-link contact-link">
            📞 Hotline: 0335254586
          </a>
        </div>

        {/* Cart */}
        <div className="menu-item">
          <Link to="/cart" className={`menu-link cart-menu-link ${isActive('/cart') ? 'active' : ''}`} onClick={closeMenu}>
            <span>🛒 Giỏ hàng</span>
            {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
          </Link>
        </div>

        {/* Divider */}
        <div className="menu-divider"></div>

        {/* Auth Section */}
        {!user ? (
          <>
            <div className="menu-item">
              <Link to="/login" className="menu-link auth-menu-link" onClick={closeMenu}>
                🔐 Đăng nhập
              </Link>
            </div>
            <div className="menu-item">
              <Link to="/register" className="menu-link auth-menu-link register" onClick={closeMenu}>
                📝 Đăng ký
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="menu-item user-info-mobile">
              <div className="user-details">
                <span className="user-avatar">👤</span>
                <span className="username">{user.username}</span>
                {user.role === 'admin' && <span className="admin-badge">Admin</span>}
              </div>
            </div>
            <div className="menu-item">
              <button className="menu-link logout-menu-btn" onClick={handleLogout}>
                🚪 Đăng xuất
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}