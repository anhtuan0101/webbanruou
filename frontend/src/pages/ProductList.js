import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  // Khi searchParams thay đổi (ví dụ click từ menu), cập nhật selectedCategory và selectedType
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    setSelectedCategory(urlCategory);
    const urlTypeRaw = searchParams.get('type') || '';
    const urlType = normalizeTypeParam(urlTypeRaw);
    // debug: show incoming URL params and normalization
    console.debug('[ProductList] URL params -> category:', urlCategory, 'typeRaw:', urlTypeRaw, 'normalizedType:', urlType);
    setSelectedType(urlType);
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
    { category_id: 1, name: 'TRÁI CÂY NHẬP KHẨU' },
    { category_id: 2, name: 'GIỎ QUÀ TRÁI CÂY' },
    { category_id: 3, name: 'HOA TƯƠI' },
    { category_id: 5, name: 'TRÁI CÂY VIỆT NAM' },

  ];

  // Build a breadcrumb-like title when we're inside a sub-type that belongs to a category.
  // Example: when category_id=1 (Giỏ trái cây) and selectedType='sinh-nhat',
  // show "Giỏ quà trái cây / Giỏ trái cây sinh nhật" as requested.
  

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedType) params.set('type', selectedType);
    if (sortBy !== 'name') params.set('sort', sortBy);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [debouncedSearch, selectedCategory, selectedType, sortBy, currentPage, setSearchParams]);

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

  useEffect(() => {
    handleSort(sortBy, 'asc');
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
    'vieng': 'GIỎ TRÁI CÂY VIẾNG',
    'sinh-nhat': 'GIỎ TRÁI CÂY SINH NHẬT',
    'tan-gia': 'GIỎ TRÁI CÂY TÂN GIA',
    'cuoi-hoi': 'GIỎ TRÁI CÂY CƯỚI HỎI',
    'ke-chuc-mung': 'KỆ HOA CHÚC MỪNG',
    'ke-kinh-vieng': 'KỆ HOA KÍNH VIẾNG',
    'bo-chuc-mung': 'BÓ HOA CHÚC MỪNG',
    'bo-kinh-vieng': 'BÓ HOA KÍNH VIẾNG',
  };
  const dynamicTitle = selectedType && typeTitles[selectedType] ? typeTitles[selectedType] : null;

  // Build a breadcrumb-like title when we're inside a sub-type that belongs to a category.
  const parentCategory = selectedCategory ? categories.find(c => String(c.category_id) === String(selectedCategory)) : null;
  let parentName = parentCategory ? parentCategory.name : null;
  // Friendly override: call category 1 "Giỏ quà trái cây" to match menu text
  if (parentCategory && String(parentCategory.category_id) === '1') {
    parentName = 'TRÁI CÂY NHẬP KHẨU';
  }
  const breadcrumbTitle = (parentName && dynamicTitle) ? `${parentName} / ${dynamicTitle}` : (dynamicTitle || (parentName ? parentName : null));

  return (
    <div className="product-list-page">
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
