import React, { useState } from 'react';
import './ProductFilterBar.css';

export default function ProductFilterBar({ title, productCount, onFilter, onSort, onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setCategory('');
    setSortBy('');
    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <div className="product-filter-container">
      <div className="product-header">
        <h1 className="product-title">{title}</h1>
        <div className="product-count-badge">
          <span>{productCount} sản phẩm</span>
          <select 
            value={sortBy}
            className="sort-select"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Sắp xếp</option>
          </select>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="search-container">
        <form className="product-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="product-search-input"
          />
          <button type="submit" className="search-button">🔍</button>
        </form>
      </div>

      {/* Filter Options */}
      <div className="filter-options">
        <div className="filter-group">
          <label>Danh mục:</label>
          <select 
            value={category}
            className="filter-select" 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sắp xếp:</label>
          <select 
            value={sortBy}
            className="filter-select"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Tên A-Z</option>
          </select>
        </div>

        <button className="reset-filter-btn" onClick={handleReset}>
          ✕ Xóa bộ lọc
        </button>
      </div>

      <div className="products-count">
        Hiển thị 0 trong 130 sản phẩm
      </div>
    </div>
  );
}