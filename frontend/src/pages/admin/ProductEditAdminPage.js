import React, { useEffect, useState, useRef } from 'react';
import { getProductById, createProduct, updateProduct } from '../../services/productService';
import api from '../../services/api';
import authService from '../../services/authService';
import { useNavigate, useParams } from 'react-router-dom';
import './ProductAdmin.css';

const ProductEditAdminPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  // Các nhóm nhỏ (sub-category/type) cho sản phẩm
  const fruitBasketTypes = [
    { value: '', label: 'Không chọn nhóm nhỏ' },
    // Giỏ trái cây
    { value: 'vieng', label: 'Giỏ trái cây viếng' },
    { value: 'sinh-nhat', label: 'Giỏ trái cây sinh nhật' },
    { value: 'tan-gia', label: 'Giỏ trái cây tân gia' },
    { value: 'cuoi-hoi', label: 'Giỏ trái cây cưới hỏi' },
    // Kệ hoa
    { value: 'ke-chuc-mung', label: 'Kệ hoa chúc mừng' },
    { value: 'ke-kinh-vieng', label: 'Kệ hoa kính viếng' },
    // Bó hoa
    { value: 'bo-chuc-mung', label: 'Bó hoa chúc mừng' },
    { value: 'bo-kinh-vieng', label: 'Bó hoa kính viếng' },
  ];
  const [form, setForm] = useState({
    name: '',
    price: '',
    category_id: '',
    type: '', // thêm trường type (sub-category)
    supplier_id: '1', // mặc định 1
    stock: '100', // mặc định 100
    description: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getProductById(id)
        .then((data) => {
          // Try to map incoming product data to the admin form.
          // Some API responses may provide sub-category under different fields (type, sub_category_name, sub_category).
          const matchedType = fruitBasketTypes.find(t => t.value === data.type || t.label === data.sub_category_name || t.label === data.subcategory_name);
          setForm({
            name: data.name || '',
            price: data.price || '',
            category_id: data.category_id || '',
            type: matchedType ? matchedType.value : (data.type || ''),
            supplier_id: data.supplier_id ? String(data.supplier_id) : '1',
            stock: data.stock ? String(data.stock) : '100',
            description: data.description || '',
            image_url: data.image_url || data.image || ''
          });
          setPreview(data.image_url || data.image || '');
        })
        .catch(() => alert('Không tìm thấy sản phẩm!'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Hiển thị preview ngay
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      // Upload file lên backend
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setForm((f) => ({ ...f, image_url: res.data.imageUrl }));
      } catch (err) {
        alert('Upload ảnh thất bại!');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Đảm bảo các trường số là số, không phải chuỗi rỗng
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      category_id: Number(form.category_id) || 1,
      type: form.type || '',
      // Provide multiple aliases so backend that expects different names will receive the data
      sub_category: form.type || '',
      subcategory: form.type || '',
      sub_category_name: (fruitBasketTypes.find(t => t.value === form.type) || {}).label || form.type || '',
      subcategory_name: (fruitBasketTypes.find(t => t.value === form.type) || {}).label || form.type || '',
      type_label: (fruitBasketTypes.find(t => t.value === form.type) || {}).label || form.type || '',
      sub_category_label: (fruitBasketTypes.find(t => t.value === form.type) || {}).label || form.type || '',
      supplier_id: Number(form.supplier_id) || 1,
      stock: Number(form.stock) || 0,
      image_url: form.image_url,
      description: form.description
    };
    try {
      // Debug: log payload before sending to API so we can inspect what fields are included
      console.debug('[Admin] submitting product payload:', payload);
      // capture current auth header and user for debugging (helps diagnose 401/403)
      const currentAuthHeader = api.defaults?.headers?.common?.Authorization || localStorage.getItem('accessToken') || localStorage.getItem('token') || sessionStorage.getItem('accessToken') || sessionStorage.getItem('token') || null;
      const currentUser = authService.getUser ? authService.getUser() : (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
      setDebugInfo({ stage: 'submitting', payload, auth: { header: currentAuthHeader, user: currentUser } });

      if (isEdit) {
        const res = await updateProduct(id, payload);
        console.debug('[Admin] updateProduct response:', res);
        // Verify persisted record by fetching it back from the API
        let persisted = null;
        try {
          persisted = await getProductById(id);
          console.debug('[Admin] persisted after update:', persisted);
        } catch (err) {
          console.debug('[Admin] verify fetch after update failed', err);
        }

        setDebugInfo({ stage: 'updated', payload, apiResponse: res, persisted });

        if (!persisted) {
          alert('Cập nhật thành công (không thể xác minh trên server). Kiểm tra bảng debug bên dưới.');
        } else if (!persisted.sub_category_name && payload.sub_category_name) {
          alert('Cập nhật thành công, nhưng server không lưu trường nhóm nhỏ. Kiểm tra bảng debug bên dưới.');
        } else {
          alert('Cập nhật thành công!');
        }

      } else {
        const res = await createProduct(payload);
        console.debug('[Admin] createProduct response:', res);
        // Try to detect created id from response and verify persisted record
        const createdId = res?.product_id || res?.id || null;
        let persisted = null;
        if (createdId) {
          try {
            persisted = await getProductById(createdId);
            console.debug('[Admin] persisted after create:', persisted);
          } catch (err) {
            console.debug('[Admin] verify fetch after create failed', err);
          }
        }

        setDebugInfo({ stage: 'created', payload, apiResponse: res, persisted });

        if (createdId) {
          if (!persisted) {
            alert('Thêm thành công (không thể xác minh trên server). Kiểm tra bảng debug bên dưới.');
          } else if (!persisted.sub_category_name && payload.sub_category_name) {
            alert('Thêm thành công, nhưng server không lưu trường nhóm nhỏ. Kiểm tra bảng debug bên dưới.');
          } else {
            alert('Thêm thành công!');
          }
        } else {
          alert('Thêm thành công!');
        }
      }

      // Decide whether to navigate away automatically:
      // - If we could verify persistence and the server stored sub_category_name, navigate back to list.
      // - Otherwise stay on the edit page so the debug panel is visible for troubleshooting.
      const persistedOk = debugInfo && (debugInfo.persisted && (debugInfo.persisted.sub_category_name || !payload.sub_category_name));
      if (persistedOk) {
        // slight delay so user sees alert then redirect
        setTimeout(() => navigate('/admin/products'), 700);
      }
    } catch (err) {
      console.error('[Admin] save failed', err);
      setDebugInfo({ stage: 'error', payload, error: (err && err.response && err.response.data) ? err.response.data : String(err) });
      alert('Lưu thất bại! Kiểm tra bảng debug bên dưới.');
    }
    setLoading(false);
  };
  return (
    <div>
      <form className="admin-product-form" onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto', background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #0001' }}>
        <h2 style={{ color: '#e67e22', marginBottom: 24 }}>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
        <div className="form-group">
          <label>Tên sản phẩm:</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Giá:</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} required min={0} />
        </div>
        <div className="form-group">
          <label>Danh mục ID:</label>
          <input type="number" name="category_id" value={form.category_id} onChange={handleChange} required min={1} />
        </div>
        {/* Nhóm nhỏ (sub-category/type) */}
        <div className="form-group">
          <label>Nhóm nhỏ (sub-category):</label>
          <select name="type" value={form.type} onChange={handleChange} className="filter-select">
            {fruitBasketTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Nhà cung cấp ID:</label>
          <input type="number" name="supplier_id" value={form.supplier_id} onChange={handleChange} required min={1} />
        </div>
        <div className="form-group">
          <label>Số lượng (stock):</label>
          <input type="number" name="stock" value={form.stock} onChange={handleChange} required min={0} />
        </div>
        <div className="form-group">
          <label>Mô tả:</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
        </div>
        <div className="form-group">
          <label>Ảnh sản phẩm:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          {preview && <img src={preview} alt="preview" style={{ width: 120, marginTop: 8, borderRadius: 8 }} />}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="submit" className="admin-btn" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" className="admin-btn" style={{ background: '#f59e42', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }} onClick={() => navigate('/admin/products')}>Quay lại</button>
        </div>
        {/* Debug panel: shows payload, API response, and persisted product for troubleshooting */}
        {debugInfo && (
          <div style={{ marginTop: 20, background: '#0f172a', color: '#e6eef8', padding: 12, borderRadius: 8, fontSize: 13 }}>
            <strong>Debug info (copy-paste this):</strong>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', marginTop: 8 }}>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductEditAdminPage;
