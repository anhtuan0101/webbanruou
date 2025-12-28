import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import { normalizeTypeParam } from '../utils/normalizeType';
import { normalizeString } from '../utils/normalizeString';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import './ProductList.css';

export default function ProductList() {
  // Sub-categories cho Giỏ trái cây
  const fruitBasketTypes = [
    { value: '', label: 'Tất cả nhóm nhỏ' },
    { value: 'vieng', label: 'Giỏ trái cây viếng' },
    { value: 'sinh-nhat', label: 'Giỏ trái cây sinh nhật' },
    { value: 'tan-gia', label: 'Giỏ trái cây tân gia' },
    { value: 'cuoi-hoi', label: 'Giỏ trái cây cưới hỏi' },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const headerTypingRef = useRef(false);
  const headerTypingTimerRef = useRef(null);

  // Listen for header live-search events (dispatched during typing). This
  // allows the header to update ProductList immediately without navigating
  // and causing a route-level re-render that produced visual jumpiness.
  useEffect(() => {
    const handler = (e) => {
      const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : '';
      // mark that the header is actively typing so we don't write URL params
      // during this short period (prevents flicker of category/title)
      headerTypingRef.current = true;
      if (headerTypingTimerRef.current) clearTimeout(headerTypingTimerRef.current);
      headerTypingTimerRef.current = setTimeout(() => {
        headerTypingRef.current = false;
        headerTypingTimerRef.current = null;
      }, 1000);
      setSearchTerm(v);
    };
    window.addEventListener('header:search', handler);
    return () => {
      window.removeEventListener('header:search', handler);
      if (headerTypingTimerRef.current) {
        clearTimeout(headerTypingTimerRef.current);
        headerTypingTimerRef.current = null;
      }
    };
  }, []);

  // Listen for header hover events and immediately reflect the hovered
  // category in the page (update selectedCategory + address bar without full
  // navigation). This makes hovering a menu show the category view.
  useEffect(() => {
    const onHover = (e) => {
      const cat = e && e.detail && e.detail.category ? String(e.detail.category) : '';
      if (!cat) return;
      // cancel any pending debounce timer and set immediately
      if (categoryTimerRef.current) {
        clearTimeout(categoryTimerRef.current);
        categoryTimerRef.current = null;
      }
      setSelectedCategory(cat);
      // reflect in address bar without React Router navigation
      try {
        const params = new URLSearchParams(searchParams);
        if (cat) params.set('category', cat);
        else params.delete('category');
        const qs = params.toString();
        const newUrl = qs ? `/products?${qs}` : '/products';
        window.history.replaceState(window.history.state, '', newUrl);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('header:hoverCategory', onHover);
    return () => window.removeEventListener('header:hoverCategory', onHover);
  }, [searchParams]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const categoryTimerRef = useRef(null);
  const lastUrlChangeRef = useRef(0);

  // Debug logs: trace when searchParams or selectedCategory change to find
  // the source of the title flicker the user reported.
  useEffect(() => {
    try {
      console.debug(`[ProductList][debug] ${new Date().toISOString()} searchParams:`, searchParams.toString());
    } catch (err) {}
  }, [searchParams]);

  useEffect(() => {
    try {
      console.debug(`[ProductList][debug] ${new Date().toISOString()} selectedCategory ->`, selectedCategory);
    } catch (err) {}
  }, [selectedCategory]);

  // Khi searchParams thay đổi (ví dụ click từ menu), cập nhật selectedCategory và selectedType
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    // Debounce category updates slightly to avoid rapid toggles when the
    // nav/menu may cause transient searchParams changes (prevents title flicker).
    if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current);
    categoryTimerRef.current = setTimeout(() => {
      setSelectedCategory(urlCategory);
      categoryTimerRef.current = null;
    }, 120);
    // Keep searchTerm synced with URL `search` param (so header -> /products?search=... works)
    const urlSearch = searchParams.get('search') || '';
    setSearchTerm(urlSearch);

    const urlTypeRaw = searchParams.get('type') || '';
    const urlType = normalizeTypeParam(urlTypeRaw);
    // debug: show incoming URL params and normalization
    console.debug('[ProductList] URL params -> category:', urlCategory, 'typeRaw:', urlTypeRaw, 'normalizedType:', urlType, 'search:', urlSearch);
    setSelectedType(urlType);
    // mark that URL/searchParams changed due to navigation so update-effect
    // can avoid immediately writing params back (prevents races)
    lastUrlChangeRef.current = Date.now();
  }, [searchParams]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    products,
    allProducts,
    loading,
    error,
    currentPage,
    totalPages,
    handleSearch,
    handleCategoryFilter,
    handleTypeFilter,
    handleSort,
    goToPage,
    filteredCount,
    totalCount
  } = useProducts();

  // Get categories - temporary mock data
  const categories = [
    { category_id: 1, name: 'RƯỢU VANG' },
    { category_id: 2, name: 'HỘP QUÀ RƯỢU TẾT' },
    { category_id: 3, name: 'RƯỢU NHẬP KHẨU' },
    { category_id: 5, name: 'RƯỢU VIỆT NAM' },

  ];

  // Build a breadcrumb-like title when we're inside a sub-type that belongs to a category.
  // Example: when category_id=1 (Giỏ trái cây) and selectedType='sinh-nhat',
  // show "Giỏ quà trái cây / Giỏ trái cây sinh nhật" as requested.
  

  // Update URL params when filters change
  useEffect(() => {
    // Build desired params starting from current searchParams. We prefer the
    // current URL `search` param if it differs from our debouncedSearch to
    // avoid overwriting an external navigation (e.g. header typing/submit).
    const params = new URLSearchParams(searchParams);

    // Tentatively set search from our debounced input
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');

    // Non-search filters
    if (selectedCategory) params.set('category', selectedCategory);
    else params.delete('category');
    if (selectedType) params.set('type', selectedType);
    else params.delete('type');
    if (sortBy !== 'name') params.set('sort', sortBy);
    else params.delete('sort');
    if (currentPage !== 1) params.set('page', currentPage.toString());
    else params.delete('page');

  const currentQs = searchParams.toString();
  const newQs = params.toString();

  if (currentQs === newQs) return; // nothing to do

  // If the header is actively typing or we just received a navigation
  // update to the URL (clicking a nav/subtype), delay writing URL params
  // to avoid races and flicker. lastUrlChangeRef is set when searchParams
  // changes (above).
  if (headerTypingRef.current) return;
  if (lastUrlChangeRef.current && (Date.now() - lastUrlChangeRef.current) < 500) return;

    // If the current URL search param differs from our debouncedSearch, it's
    // likely an external navigation (header submit). In that case, don't overwrite
    // the `search` param — only update other params if needed.
    const currentSearch = searchParams.get('search') || '';
    const debouncedSearchValue = debouncedSearch || '';
    if (currentSearch !== debouncedSearchValue) {
      const paramsKeepSearch = new URLSearchParams(searchParams);
      if (selectedCategory) paramsKeepSearch.set('category', selectedCategory);
      else paramsKeepSearch.delete('category');
      if (selectedType) paramsKeepSearch.set('type', selectedType);
      else paramsKeepSearch.delete('type');
      if (sortBy !== 'name') paramsKeepSearch.set('sort', sortBy);
      else paramsKeepSearch.delete('sort');
      if (currentPage !== 1) paramsKeepSearch.set('page', currentPage.toString());
      else paramsKeepSearch.delete('page');

      const keepQs = paramsKeepSearch.toString();
      if (keepQs !== currentQs) {
        setSearchParams(paramsKeepSearch);
      }
      return;
    }

    // Normal case: we control the search param, write desired params.
    setSearchParams(params);
  }, [debouncedSearch, selectedCategory, selectedType, sortBy, currentPage, searchParams, setSearchParams]);

  // Apply filters when they change
  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch, handleSearch]);

  useEffect(() => {
    handleCategoryFilter(selectedCategory);
  }, [selectedCategory, handleCategoryFilter]);

  // Apply type filter from URL or UI
  useEffect(() => {
    handleTypeFilter && handleTypeFilter(selectedType);
  }, [selectedType, handleTypeFilter]);

  // Parse sortBy value to extract field and order
  useEffect(() => {
    // Parse sortBy value (e.g., "price_desc" -> field: "price", order: "desc")
    let field = sortBy;
    let order = 'asc';
    
    if (sortBy && sortBy.includes('_desc')) {
      field = sortBy.replace('_desc', '');
      order = 'desc';
    } else if (sortBy && sortBy.includes('_asc')) {
      field = sortBy.replace('_asc', '');
      order = 'asc';
    }
    
    handleSort(field, order);
  }, [sortBy, handleSort]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    goToPage(1); // Reset to first page on new search
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    // Nếu đổi danh mục, reset type về ''
    setSelectedType('');
    goToPage(1);
  };

  // Khi chọn type (sub-category), cập nhật URL params để đồng bộ với menu header
  const handleTypeChange = (e) => {
    const value = e.target.value;
    const normalized = normalizeTypeParam(value);
    setSelectedType(normalized);
    const params = new URLSearchParams(searchParams);
    if (normalized) {
      params.set('type', normalized);
    } else {
      params.delete('type');
    }
    setSearchParams(params);
    goToPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    goToPage(1);
  };

  const handlePageChange = (page) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('name');
    goToPage(1);
  };

  const hasActiveFilters = searchTerm || selectedCategory || sortBy !== 'name';

  // products already filtered inside useProducts by category/type when we call handlers
  const filteredProductsByType = products;


  // Prepare a safe fallback: if a `type` is selected but it returns zero products,
  // first try a fuzzy-name match (match normalized tokens from selectedType against product name).
  // If that yields nothing, fall back to showing all products for the selected `category` (non-destructive).
  const categoryOnlyProducts = selectedCategory
    ? (allProducts || []).filter(p => Number(p.category_id) === Number(selectedCategory))
    : [];

  let fuzzyMatches = [];
  if (selectedType && products.length === 0) {
    try {
      // tokens from selectedType e.g. 'ke-vieng' -> ['ke','vieng']
      const tokens = String(selectedType).split(/[-_\s]+/).map(t => normalizeString(t)).filter(Boolean);
      if (tokens.length > 0) {
        const pool = categoryOnlyProducts.length > 0 ? categoryOnlyProducts : (allProducts || []);
        fuzzyMatches = pool.filter(p => {
          const name = normalizeString(p.name || p.title || '');
          // require all tokens to be present in name
          return tokens.every(tok => name.includes(tok));
        });
      }
    } catch (err) {
      console.warn('[ProductList] fuzzy matching failed', err);
      fuzzyMatches = [];
    }
  }

  const isFallback = selectedType && (products.length === 0) && (fuzzyMatches.length === 0) && categoryOnlyProducts.length > 0;
  // priority: exact type-filtered `products` -> fuzzyMatches -> categoryOnlyProducts
  const displayedProducts = (products && products.length > 0)
    ? products
    : (fuzzyMatches && fuzzyMatches.length > 0)
      ? fuzzyMatches
      : categoryOnlyProducts;

  // debug: show selected filters and counts (helpful to diagnose why sub-type shows nothing)
  console.debug('[ProductList] selectedCategory:', selectedCategory, 'selectedType:', selectedType, 'productsCount:', products.length, 'fuzzyMatches:', fuzzyMatches.length, 'categoryOnlyCount:', categoryOnlyProducts.length, 'displayedCount:', displayedProducts.length, 'isFallback:', isFallback);

  // Tiêu đề động cho type
  const typeTitles = {
    'vieng': 'HỘP QUÀ RƯỢU LINH CHI',
    'sinh-nhat': 'HỘP QUÀ RƯỢU VANG TẾT',
    'tan-gia': 'RƯỢU LINH VẬT',
    'cuoi-hoi': 'HỘP QUÀ RƯỢU MẠNH TẾT',
    'ke-chuc-mung': 'RƯỢU HÀN', //KỆ HOA CHÚC MỪNG
    'ke-kinh-vieng': 'RƯỢU NHẬT',
    'bo-chuc-mung': 'RƯỢU MỸ',
    'bo-kinh-vieng': 'RƯỢU CANADA',
  };
  const dynamicTitle = selectedType && typeTitles[selectedType] ? typeTitles[selectedType] : null;

  // Build a breadcrumb-like title when we're inside a sub-type that belongs to a category.
  const parentCategory = selectedCategory ? categories.find(c => String(c.category_id) === String(selectedCategory)) : null;
  let parentName = parentCategory ? parentCategory.name : null;
  // Friendly override: call category 1 "Giỏ quà trái cây" to match menu text
  if (parentCategory && String(parentCategory.category_id) === '1') {
    parentName = 'RƯỢU VANG';
  }
  const breadcrumbTitle = (parentName && dynamicTitle) ? `${parentName} / ${dynamicTitle}` : (dynamicTitle || (parentName ? parentName : null));

  const pageTitle = breadcrumbTitle ? `${breadcrumbTitle} | OanhTraiCay` : 'Tất cả sản phẩm | OanhTraiCay';
  const pageDescription = dynamicTitle
    ? `Xem các sản phẩm nhóm ${dynamicTitle} tại OanhTraiCay. Lọc, chọn và đặt hàng online.`
    : 'Danh sách sản phẩm tại OanhTraiCay. Tìm kiếm và lọc theo danh mục để chọn sản phẩm phù hợp.';

  return (
    <div className="product-list-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://oanhtraicay.com${window.location.pathname}${window.location.search}`} />
      </Helmet>
      <div className="container">
        {/* Header with Sort */}
        <div className="page-header">
          <div className="header-content">
            <h1>
              {parentName && dynamicTitle ? (
                <>
                  <span className="breadcrumb-parent">{parentName}</span>
                  <span className="breadcrumb-sep"> / </span>
                  <span className="breadcrumb-child">{dynamicTitle}</span>
                </>
              ) : (
                (breadcrumbTitle || 'Tất cả sản phẩm')
              )}
            </h1>
            <div className="header-right">
              <span className="product-count">{displayedProducts.length} sản phẩm</span>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="name">Sắp xếp</option>
                <option value="name">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
                <option value="price">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-grid">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="product-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-price"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Có lỗi xảy ra</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">
                Thử lại
              </button>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>
                {hasActiveFilters 
                  ? 'Không tìm thấy sản phẩm phù hợp' 
                  : 'Chưa có sản phẩm nào'
                }
              </h3>
              <p>
                {hasActiveFilters
                  ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                  : 'Cửa hàng đang cập nhật sản phẩm mới'
                }
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Inform the user if we fell back to category results because the selected type had no items */}
              {isFallback && (
                <div className="fallback-banner">
                  <p>
                    Không tìm thấy sản phẩm cho nhóm nhỏ này. Hiển thị tất cả sản phẩm trong danh mục.
                  </p>
                </div>
              )}
              <div className="products-grid">
                {(displayedProducts || []).map(product => (
                  <ProductCard 
                    key={product.product_id} 
                    product={product}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showInfo={true}
                    totalItems={filteredCount}
                    itemsPerPage={12}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
