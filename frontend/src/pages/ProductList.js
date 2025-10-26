import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
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
    const urlType = searchParams.get('type') || '';
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
    { category_id: 1, name: 'Giỏ trái cây' },
    { category_id: 2, name: 'Hoa tươi' },
    { category_id: 3, name: 'Trái cây nhập khẩu' },
  ];

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
    setSelectedType(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('type', value);
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

  // Tiêu đề động cho type
  const typeTitles = {
    'vieng': 'Giỏ trái cây viếng',
    'sinh-nhat': 'Giỏ trái cây sinh nhật',
    'tan-gia': 'Giỏ trái cây tân gia',
    'cuoi-hoi': 'Giỏ trái cây cưới hỏi',
    'ke-chuc-mung': 'Kệ hoa chúc mừng',
    'ke-kinh-vieng': 'Kệ hoa kính viếng',
    'bo-chuc-mung': 'Bó hoa chúc mừng',
    'bo-kinh-vieng': 'Bó hoa kính viếng',
  };
  const dynamicTitle = selectedType && typeTitles[selectedType] ? typeTitles[selectedType] : null;

  return (
    <div className="product-list-page">
      <div className="container">
        {/* Header with Sort */}
        <div className="page-header">
          <div className="header-content">
            <h1>{dynamicTitle || 'Tất cả sản phẩm'}</h1>
            <div className="header-right">
              <span className="product-count">{products.length} sản phẩm</span>
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
          ) : products.length === 0 ? (
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
              <div className="products-grid">
                {(filteredProductsByType || []).map(product => (
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
