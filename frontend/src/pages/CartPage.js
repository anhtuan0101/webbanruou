import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import formatPrice from '../utils/formatPrice';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

// Đảm bảo ảnh luôn đúng domain/backend
function normalizeImageUrl(raw) {
  if (!raw) return '/placeholder.svg';
  let url = String(raw).trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads/')) {
    return (process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000') + url;
  }
  return url;
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useContext(CartContext);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Giỏ hàng trống</h2>
            <p>Hãy thêm một số sản phẩm tươi ngon vào giỏ hàng của bạn!</p>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Giỏ hàng của bạn</h1>
          <p className="cart-count">{cart.length} sản phẩm</p>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.product_id} className="cart-item">
                <div className="item-image">
                  <img
                    src={normalizeImageUrl(item.image_url || item.image) || `/api/placeholder/80/80`}
                    alt={item.name}
                    style={{ objectFit: 'cover', borderRadius: 16 }}
                    onError={e => { e.target.src = '/api/placeholder/80/80'; }}
                  />
                </div>
                
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-description">{item.description}</p>
                  <p className="item-price">
                    {formatPrice(item.price)} <span className="per-unit">/ đơn vị</span>
                  </p>
                </div>

                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn decrease"
                      onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input 
                      type="number"
                      className="quantity-input"
                      value={item.quantity}
                      min="1"
                      max={item.stock || 99}
                      onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 1)}
                    />
                    <button 
                      className="quantity-btn increase"
                      onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= (item.stock || 99)}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.product_id)}
                    title="Xóa khỏi giỏ hàng"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Tóm tắt đơn hàng</h3>
              
              <div className="summary-row">
                <span>Tạm tính ({cart.length} sản phẩm)</span>
                <span>{formatPrice(getCartTotal())}</span>
              </div>
              
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span className="free">Miễn phí</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Tổng cộng</span>
                <span>{formatPrice(getCartTotal())}</span>
              </div>

              <div className="action-buttons">
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                >
                  Thanh toán
                </button>
                
                <button 
                  className="clear-cart-btn"
                  onClick={clearCart}
                >
                  Xóa toàn bộ giỏ hàng
                </button>
                
                <button 
                  className="continue-shopping-link"
                  onClick={() => navigate('/products')}
                >
                  ← Tiếp tục mua sắm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}