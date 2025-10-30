import React from 'react';
import { Link } from 'react-router-dom';
import formatPrice from '../utils/formatPrice';
import normalizeString from '../utils/normalizeString';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  // Normalize image URL (handle Windows paths, backslashes, spaces)
  // Thống nhất normalizeImageUrl với ProductCard.new và ProductDetailView
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

  const imageUrl = normalizeImageUrl(product.image_url || product.image) || '/placeholder.svg';
  // Build an SEO-friendly slug path: use normalized name + id
  const slugBase = normalizeString(product.name || product.title || 'product').replace(/\s+/g, '-');
  const idPart = product.product_id || product.id || product.productId || '';
  const productUrl = idPart ? `/products/${slugBase}-${idPart}` : `/products/${product.product_id}`;

  // Build a lightweight srcSet from available image arrays if present.
  const srcSet = (() => {
    const imgs = product.images || product.gallery || product.photos || [];
    if (!imgs || !Array.isArray(imgs) || imgs.length === 0) return undefined;
    try {
      // Map up to 3 sizes (best-effort). Sizes are best-effort hints.
      return imgs.slice(0, 3).map((r, i) => {
        const url = normalizeImageUrl(r);
        const size = i === 0 ? '800w' : i === 1 ? '400w' : '200w';
        return `${url} ${size}`;
      }).join(', ');
    } catch (e) {
      return undefined;
    }
  })();

  const imgWidth = product.image_width || product.imageWidth || product.width;
  const imgHeight = product.image_height || product.imageHeight || product.height;

  return (
    <div className="product-card">
  <Link to={productUrl} className="product-image-container" style={{display:'block'}}>
        <img
          src={imageUrl}
          className="product-image"
          alt={product.name ? `${product.name} - Giỏ trái cây cao cấp từ OanhTraiCay` : 'Sản phẩm OanhTraiCay'}
          loading="lazy"
          decoding="async"
          srcSet={srcSet}
          sizes={srcSet ? '(max-width: 600px) 100vw, 300px' : undefined}
          {...(imgWidth && imgHeight ? { width: imgWidth, height: imgHeight } : {})}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.svg';
            e.target.style.background = '#f5f5f5';
            e.target.style.objectFit = 'contain';
            // Hiển thị overlay lỗi ảnh
            const parent = e.target.parentNode;
            let errorDiv = parent.querySelector('.image-error-overlay');
            if (!errorDiv) {
              errorDiv = document.createElement('div');
              errorDiv.className = 'image-error-overlay';
              errorDiv.style.position = 'absolute';
              errorDiv.style.top = '0';
              errorDiv.style.left = '0';
              errorDiv.style.width = '100%';
              errorDiv.style.height = '100%';
              errorDiv.style.background = 'rgba(245,245,245,0.8)';
              errorDiv.style.display = 'flex';
              errorDiv.style.alignItems = 'center';
              errorDiv.style.justifyContent = 'center';
              errorDiv.style.color = '#888';
              errorDiv.style.fontSize = '14px';
              errorDiv.style.zIndex = '3';
              errorDiv.innerText = 'Không thể hiển thị ảnh sản phẩm';
              parent.appendChild(errorDiv);
            }
          }}
        />
        {product.stock === 0 && <div className="out-of-stock-overlay">Hết hàng</div>}
      </Link>
      <div className="product-info">
        <h5 className="product-name" title={product.name}>
          {product.name}
        </h5>
        <div className="product-price">
          {formatPrice(product.price)}
        </div>
        {product.category_name && (
          <p className="product-category">
            Loại: {product.category_name}
          </p>
        )}
          {/* Show sub-category / small group (if API provides it under any of several possible fields) */}
          {(
            product.sub_category_name ||
            product.subcategory_name ||
            product.sub_category ||
            product.type_label ||
            product.type
          ) && (
            <p className="product-subcategory">
              Nhóm nhỏ: {product.sub_category_name || product.subcategory_name || product.sub_category || product.type_label || product.type}
            </p>
          )}
        <div className="product-actions">
          <button 
            className="btn btn-add-cart" 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </div>
  );
}
