import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import './LoginPage.css';


export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from route
  const isRegisterRoute = location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(isRegisterRoute);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from || '/';

  // Sync isRegister with route
  useEffect(() => {
    setIsRegister(isRegisterRoute);
    setErrors({});
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      confirmPassword: ''
    });
  }, [isRegisterRoute]);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    }

    if (isRegister) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email là bắt buộc';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }

      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Họ tên là bắt buộc';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Số điện thoại là bắt buộc';
      } else if (!/^\d{9,11}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Địa chỉ là bắt buộc';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
      }
    } else {
      if (!formData.password) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        const success = await register({
          username: formData.username,
          email: formData.email,
          name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          password: formData.password
        });

        if (success) {
          showSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsRegister(false);
          setFormData({
            username: formData.username,
            email: '',
            full_name: '',
            phone: '',
            address: '',
            password: '',
            confirmPassword: ''
          });
        }
      } else {
        // Cho phép nhập email hoặc username
        let loginPayload = {};
        if (/^\S+@\S+\.\S+$/.test(formData.username)) {
          loginPayload = { email: formData.username, password: formData.password };
        } else {
          loginPayload = { username: formData.username, password: formData.password };
        }
        const success = await login(loginPayload);
        if (success) {
          showSuccess('Đăng nhập thành công!');
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      // Error handled by auth context
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    // Switch between /login and /register
    if (isRegister) {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="login-page">
      <Helmet>
        <title>{isRegister ? 'Tạo tài khoản | OanhTraiCay' : 'Đăng nhập | OanhTraiCay'}</title>
        <meta name="description" content={isRegister ? 'Tạo tài khoản mới tại OanhTraiCay để đặt hàng và quản lý đơn hàng dễ dàng.' : 'Đăng nhập vào OanhTraiCay để tiếp tục mua sắm và quản lý đơn hàng của bạn.'} />
      </Helmet>
      <div className="login-container">
        <div className="login-header">
          <div className="brand-logo">🍎</div>
          <h1>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
          <p>
            {isRegister 
              ? 'Tham gia cộng đồng yêu thích trái cây tươi ngon' 
              : 'Chào mừng bạn trở lại với cửa hàng trái cây'
            }
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Nhập tên đăng nhập"
              disabled={isSubmitting}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label htmlFor="full_name">Họ và tên *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.full_name ? 'error' : ''}`}
                  placeholder="Nhập họ và tên"
                  disabled={isSubmitting}
                />
                {errors.full_name && <span className="error-message">{errors.full_name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Nhập số điện thoại"
                  disabled={isSubmitting}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="address">Địa chỉ *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  placeholder="Nhập địa chỉ giao hàng"
                  disabled={isSubmitting}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Nhập địa chỉ email"
                  disabled={isSubmitting}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">
              Mật khẩu *
              {isRegister && <span className="password-hint">(tối thiểu 6 ký tự)</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Nhập mật khẩu"
              disabled={isSubmitting}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Đang xử lý...
              </>
            ) : (
              isRegister ? 'Tạo tài khoản' : 'Đăng nhập'
            )}
          </button>

          <div className="form-footer">
            <p>
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              <button
                type="button"
                className="toggle-btn"
                onClick={toggleMode}
                disabled={isSubmitting}
              >
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
              </button>
            </p>

            {!isRegister && (
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            )}
          </div>
        </form>

        <div className="back-home">
          <Link to="/" className="back-home-link">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
