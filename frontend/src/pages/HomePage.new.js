import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.new';
import { getFeaturedProducts } from '../services/productService';
import './HomePage.new.css';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      const data = await getFeaturedProducts(8);
      setProducts(data);
    } catch (err) {
      console.error('Error loading featured products:', err);
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị lưới sản phẩm nổi bật
  const renderProductsGrid = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Đang tải sản phẩm nổi bật...</h3>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-state">
          <div className="empty-icon">⚠️</div>
          <h3>Rất tiếc! Đã có lỗi xảy ra</h3>
          <p>{error}</p>
        </div>
      );
    }
    
    if (!products.length) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🍎</div>
          <h3>Hiện chưa có sản phẩm nổi bật</h3>
          <p>Chúng tôi đang cập nhật thêm sản phẩm mới. Quý khách vui lòng quay lại sau!</p>
        </div>
      );
    }
    
    return (
      <div className="homepage-products-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="home-page">
      {/* Phần Banner Chính */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            
            
            <Link to="/products" className="hero-cta">
              🛒 Mua sắm ngay
            </Link>
          </div>
          
          <div className="hero-image">
            <div className="hero-emoji"></div>
          </div>
        </div>
      </section>

      {/* Phần Sản Phẩm Nổi Bật */}
      <section className="featured-section">
        <div className="section-header">
          <h2 className="homepage-section-title">Sản Phẩm Nổi Bật</h2>
        </div>
        
        {renderProductsGrid()}
        
        {!loading && !error && products.length > 0 && (
          <div className="section-footer">
            <Link to="/products" className="view-all-btn">
              Xem tất cả sản phẩm
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}