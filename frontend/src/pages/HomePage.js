import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.new';
import { getFeaturedProducts } from '../services/productService';
import './HomePage.css';

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
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
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

      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="homepage-section-title">Sản Phẩm Nổi Bật</h2>
          </div>
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <h3>Đang tải sản phẩm...</h3>
              <p>Vui lòng chờ trong giây lát</p>
            </div>
          )}
          {error && (
            <div className="error-state">
              <div className="empty-icon">⚠️</div>
              <h3>Có lỗi xảy ra</h3>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🍎</div>
              <h3>Chưa có sản phẩm nổi bật</h3>
              <p>Hệ thống đang cập nhật các sản phẩm mới. Vui lòng quay lại sau!</p>
            </div>
          )}
          <div className="featured-products-grid">
            {products.map(product => {
              // Log dữ liệu từng sản phẩm để debug
              console.log('Sản phẩm homepage:', product);
              // Hiển thị đường dẫn ảnh để kiểm tra
              return (
                <div style={{border: '1px dashed #ccc', marginBottom: 8, padding: 4}}>
                  <div style={{fontSize: 12, color: '#888'}}>image_url: {product.image_url}</div>
                  <ProductCard key={product.product_id || product._id} product={product} />
                </div>
              );
            })}
          </div>
          {!loading && !error && products.length > 0 && (
            <div className="section-footer">
              <Link to="/products" className="view-all-btn">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
