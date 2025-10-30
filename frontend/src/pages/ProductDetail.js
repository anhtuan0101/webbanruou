import React, { useEffect, useState, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { getProductById } from '../services/productService';

import ProductDetailView from './ProductDetailView';
import './ProductDetail.css';

export default function ProductDetail() {
  // Support both /products/:id and SEO-friendly /products/:slug-:id paths
  const params = useParams();
  let { id } = params;
  if (!id) id = params.id || '';
  // If id contains a '-' slug (e.g. hoa-sinh-nhat-123), extract the trailing numeric id
  if (id && id.includes('-')) {
    const parts = id.split('-');
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) {
      id = last;
    }
  }
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useContext(CartContext);
  const { showSuccess, showError, showWarning } = useNotification();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!user) {
      showWarning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    if (product.stock <= 0) {
      showError('Sản phẩm đã hết hàng');
      return;
    }

    if (quantity > product.stock) {
      showError('Số lượng vượt quá tồn kho');
      return;
    }

    addToCart(product, quantity);
    showSuccess(`Đã thêm ${product.name} vào giỏ hàng`);

  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };


  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-error">
        <h2>Có lỗi xảy ra</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <h2>Không tìm thấy sản phẩm</h2>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const metaTitle = `${product.name} | OanhTraiCay`;
  const metaDescription = (product.description && String(product.description).replace(/\s+/g, ' ').slice(0, 160)) || product.summary || `Mua ${product.name} tại OanhTraiCay`;
  const metaImage = product.image || (product.images && product.images[0]) || '';
  const metaUrl = `https://oanhtraicay.com/products/${id}`;

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {metaImage && <meta property="og:image" content={metaImage} />}
        <meta property="og:url" content={metaUrl} />
        <meta name="twitter:card" content={metaImage ? 'summary_large_image' : 'summary'} />
        <link rel="canonical" href={metaUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": metaImage ? [metaImage] : [],
            "description": String(product.description || product.summary || product.short_description || '').replace(/(<([^>]+)>)/gi, '').slice(0, 300),
            "sku": product.sku || product.product_id || String(product.id || ''),
            "mpn": product.product_id || undefined,
            "brand": {
              "@type": "Brand",
              "name": product.brand || 'OanhTraiCay'
            },
            "offers": {
              "@type": "Offer",
              "url": metaUrl,
              "priceCurrency": product.currency || 'VND',
              "price": (product.price != null ? String(product.price) : undefined),
              "availability": (product.stock > 0) ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock'
            }
          })}
        </script>
      </Helmet>
      <ProductDetailView
        product={product}
        quantity={quantity}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        handleQuantityChange={handleQuantityChange}
        handleAddToCart={handleAddToCart}
        navigate={navigate}
      />
    </>
  );
}