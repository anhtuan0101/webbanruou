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
  const [showFullDesc, setShowFullDesc] = React.useState(false);
  // helper: strip HTML tags to get plain text length
  const stripTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };
  const descText = stripTags(product.description || '');
  const isLongDesc = descText.length > 300;
  // Chuẩn hóa đường dẫn ảnh (nếu là đường dẫn tương đối thì thêm domain backend)
  const normalizeImageUrl = (raw) => {
    if (!raw) return '/api/placeholder/400/400';
    let url = String(raw).trim();
    if (/^https?:\/\//i.test(url)) return url;
    // Nếu là đường dẫn /uploads/... thì thêm domain backend
    if (url.startsWith('/uploads/')) {
      return (process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000') + url;
    }
    // Nếu là đường dẫn public khác
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
            {/* Move product description below the image for better mobile/layout */}
            {product.description && (
              <div className="image-description" style={{ width: '100%', marginTop: 12 }}>
                <h4 className="image-description-title">Mô tả</h4>
                <div className="image-description-body">
                  {/* modern description block with optional collapse */}
                  <div className={`desc-content ${showFullDesc ? 'expanded' : 'collapsed'}`}>
                    { /<[^>]+>/.test(product.description) ? (
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <div className="plain-text-description">{product.description}</div>
                    ) }
                  </div>
                  {isLongDesc && (
                    <div className="desc-actions">
                      <button className="read-more-btn" onClick={() => setShowFullDesc(s => !s)}>
                        {showFullDesc ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    </div>
                  )}
                </div>
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
        {/* description moved into image column for improved layout */}
      </div>
    </div>
  );
}
