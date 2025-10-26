import React from 'react';
import { Link } from 'react-router-dom';
import formatPrice from '../utils/formatPrice';
import './ProductDetailView.css';

export default function ProductDetailView({
  product,
  quantity,
  selectedImage,
  setSelectedImage,
  handleQuantityChange,
  handleAddToCart,
  navigate
}) {
  // Chuẩn hóa đường dẫn ảnh (nếu là đường dẫn tương đối thì thêm domain backend)
  // Thống nhất normalizeImageUrl giống homepage
  const normalizeImageUrl = (raw) => {
    if (!raw) return '/placeholder.svg';
    let url = String(raw).trim();
    if (/^https?:\/\//i.test(url)) return url;
    url = url.replace(/\\/g, '/');
    url = url.replace(/^[a-zA-Z]:\//, '/');
    if (!url.startsWith('/')) url = '/' + url;
    try {
      const parts = url.split('/').map(encodeURIComponent);
      url = parts.join('/').replace(/^%2F/, '/');
    } catch (e) {
      url = encodeURI(url);
    }
    if (url.startsWith('/uploads/')) {
      url = `http://localhost:5000${url}`;
    }
    return url;
  };
  const productImages = product.image_url ? [normalizeImageUrl(product.image_url)] : ['/api/placeholder/400/400'];

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/products">Sản phẩm</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img 
                src={productImages[selectedImage] || '/api/placeholder/300/400'} 
                alt={`Hình ảnh sản phẩm ${product.name} - FruitShop`}
                onError={(e) => {
                  e.target.src = '/api/placeholder/300/300';
                }}
              />
            </div>
            {productImages.length > 1 && (
              <div className="thumbnail-images">
                {productImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Hình ảnh ${index + 1} của ${product.name} - FruitShop`}
                    className={index === selectedImage ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/100/100';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price">
              <span className="current-price">{formatPrice(product.price)}</span>
            </div>
            <div className="product-stock">
              {product.stock > 0 ? (
                <span className="in-stock">Còn {product.stock} sản phẩm</span>
              ) : (
                <span className="out-of-stock">Hết hàng</span>
              )}
            </div>
            {product.description && (
              <div className="product-description">
                <h3>Mô tả sản phẩm</h3>
                <p>{product.description}</p>
              </div>
            )}
            {/* Quantity and Add to Cart */}
            <div className="product-actions">
              <div className="quantity-selector">
                <label>Số lượng:</label>
                <div className="quantity-controls">
                  <button 
                    type="button" 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    min="1"
                    max={product.stock}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="action-buttons">
                {product.stock > 0 ? (
                  <button 
                    className="btn btn-primary add-to-cart-btn"
                    onClick={handleAddToCart}
                  >
                    Thêm vào giỏ hàng
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Hết hàng
                  </button>
                )}
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/products')}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
