import React, { useContext, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import OrderModal from '../components/OrderModal';
import { useNavigate } from 'react-router-dom';
import formatPrice from '../utils/formatPrice';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import vi from 'date-fns/locale/vi';
import './CheckoutPage.css';

// Register Vietnamese locale for DatePicker (safe in environments where registerLocale may already be called)
try { registerLocale('vi', vi); } catch (e) { /* ignore */ }

function formatVietnamTime(date) {
	if (!date || !(date instanceof Date) || isNaN(date)) return '';
	const pad = n => n.toString().padStart(2, '0');
	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeImageUrl(raw) {
	if (!raw) return '/placeholder.svg';
	const url = String(raw).trim();
	if (/^https?:\/\//i.test(url)) return url;
	if (url.startsWith('/uploads/')) {
		return (process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000') + url;
	}

	return url;
}

export default function CheckoutPage() {
	const { cart, clearCart, getCartTotal } = useContext(CartContext);
	const { user } = useAuth();
	const { showError } = useNotification();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false);
	const [orderSuccess, setOrderSuccess] = useState(false);
	const [createdOrderId, setCreatedOrderId] = useState(null);
	const [showOrderModal, setShowOrderModal] = useState(false);
	const [lastOrderPayload, setLastOrderPayload] = useState(null);
	const [formData, setFormData] = useState({
		fullName: user?.full_name || '',
		phone: user?.phone || '',
		address: '',
		city: '',
		district: '',
		receiverName: '',
		receiverPhone: '',
		deliveryTime: null,
		notes: '',
		paymentMethod: 'cod'
	});

	const [errors, setErrors] = useState({});

	// Modal close helper
	const closeOrderModal = () => {
		setShowOrderModal(false);
		// Mark success so we show the success page after modal is closed
		setOrderSuccess(true);
		// Clear cart only when user closes the modal so the confirmation stays visible
		try { clearCart(); } catch (e) { /* ignore */ }
	};

	useEffect(() => {
		// If the cart is empty we usually redirect back to the cart page.
		// But when the order modal is open (just placed an order) we must not
		// navigate away so the user can see the confirmation. Only redirect
		// when there's no modal and no success state.
		if ((!cart || cart.length === 0) && !showOrderModal && !orderSuccess) {
			navigate('/cart');
		}
	}, [cart, navigate, showOrderModal, orderSuccess]);

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		const next = type === 'checkbox' ? checked : value;
		setFormData(prev => ({ ...prev, [name]: next }));
		if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
	};

	const handleDateChange = (date) => {
		setFormData(prev => ({ ...prev, deliveryTime: date }));
		if (errors.deliveryTime) setErrors(prev => ({ ...prev, deliveryTime: '' }));
	};

	const validateForm = () => {
		const newErrors = {};
		if (!formData.fullName || !formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
		if (!formData.phone || !formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
		else if (!/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
		// Email removed from checkout (optional) - no client-side validation required
		if (!formData.address || !formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
		if (!formData.city || !formData.city.trim()) newErrors.city = 'Tỉnh/Thành phố là bắt buộc';
		if (!formData.district || !formData.district.trim()) newErrors.district = 'Quận/Huyện là bắt buộc';
		if (!formData.receiverName || !formData.receiverName.trim()) newErrors.receiverName = 'Tên người nhận là bắt buộc';
		if (!formData.receiverPhone || !formData.receiverPhone.trim()) newErrors.receiverPhone = 'Số điện thoại người nhận là bắt buộc';
		else if (!/^[0-9]{10,11}$/.test(formData.receiverPhone)) newErrors.receiverPhone = 'Số điện thoại người nhận không hợp lệ';
		if (!formData.deliveryTime || !(formData.deliveryTime instanceof Date) || isNaN(formData.deliveryTime)) newErrors.deliveryTime = 'Vui lòng chọn ngày giờ nhận hàng';

		setErrors(newErrors);
		return { valid: Object.keys(newErrors).length === 0, newErrors };
	};

	const buildDeliveryTimeString = (dt) => {
		if (!dt || !(dt instanceof Date) || isNaN(dt)) return '';
		const pad = n => n.toString().padStart(2, '0');
		return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
	};

	const dispatchOrdersRefresh = () => {
		try { window.dispatchEvent(new CustomEvent('orders:refresh')); }
		catch (e) {
			const ev = document.createEvent('CustomEvent');
			ev.initCustomEvent('orders:refresh', true, true, {});
			window.dispatchEvent(ev);
		}
	};

	const handleSubmitOrder = async (e) => {
		e.preventDefault();
		const { valid, newErrors } = validateForm();
		if (!valid) {
			const firstKey = Object.keys(newErrors)[0];
			const firstMsg = firstKey ? newErrors[firstKey] : 'Vui lòng kiểm tra lại thông tin';
			showError(firstMsg, 'error');
			return;
		}

		setLoading(true);
		try {
			let storedUser = null;
			try { storedUser = JSON.parse(localStorage.getItem('user') || 'null'); } catch (_) { storedUser = null; }
			const resolvedCustomerId = user?.user_id || user?.id || storedUser?.user_id || storedUser?.id || null;

			const deliveryTimeStr = buildDeliveryTimeString(formData.deliveryTime);

			const payload = {
				items: cart.map(i => ({
					product_id: i.product_id,
					quantity: Number(i.quantity) || 1,
					price: typeof i.price === 'string' ? Number(i.price) : i.price
				})),
				customer_info: {
					full_name: formData.fullName,
					phone: formData.phone,
					address: `${formData.address}, ${formData.district}, ${formData.city}`,
					address_line: formData.address,
					district: formData.district,
					city: formData.city,
					receiver_name: formData.receiverName,
					receiver_phone: formData.receiverPhone,
					delivery_time: deliveryTimeStr,
					notes: formData.notes || ''
				},
				payment_method: formData.paymentMethod || 'cod',
				total_amount: getCartTotal(),
				customer_id: resolvedCustomerId
			};

			try { console.log('ORDER_PAYLOAD', JSON.stringify(payload, null, 2)); } catch (_) {}

			setLastOrderPayload(payload);
			const resp = await api.post('/orders', payload);

			// If backend returns order id, show modal with order information
			const orderId = resp?.data?.order_id || null;
			if (orderId) {
				setCreatedOrderId(orderId);
				console.log('Order created, showing modal', orderId);
				setShowOrderModal(true);
			} else {
				setOrderSuccess(true);
				// if no modal, clear cart immediately
				try { clearCart(); } catch (e) { }
			}
			dispatchOrdersRefresh();
		} catch (err) {
			console.error('Order submission error', err, err?.response?.data);
			const serverMsg = err?.response?.data?.message || (err?.response?.data ? JSON.stringify(err.response.data) : null);
			showError(serverMsg || 'Đặt hàng thất bại. Vui lòng thử lại!', 'error');
		} finally {
			setLoading(false);
		}
	};

	if (!cart || cart.length === 0) return null;

	if (orderSuccess) {
		return (
			<div className="checkout-page">
			<OrderModal show={showOrderModal} onClose={closeOrderModal} orderId={createdOrderId} lastOrderPayload={lastOrderPayload} />
				<Helmet>
					<title>Đặt hàng thành công | OanhTraiCay</title>
				</Helmet>
				<div className="container">
					<div className="checkout-header">
						<h1 style={{ color: '#2ecc40', textAlign: 'center' }}>Đặt hàng thành công!</h1>
						<p style={{ textAlign: 'center' }}>Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ xác nhận đơn sớm nhất.</p>
						<div style={{ textAlign: 'center', marginTop: 12 }}>
							<button className="submit-btn" onClick={() => navigate('/')}>Quay về trang chủ</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="checkout-page">
			<OrderModal show={showOrderModal} onClose={closeOrderModal} orderId={createdOrderId} lastOrderPayload={lastOrderPayload} />
			<Helmet>
				<title>Thanh toán - OanhTraiCay</title>
			</Helmet>

			<div className="container">
				<div className="checkout-header">
					<h1>Thanh toán đơn hàng</h1>
					<p>Vui lòng kiểm tra thông tin và hoàn tất đặt hàng</p>
				</div>

				<div className="checkout-content">
					<div className="checkout-form">
						<form onSubmit={handleSubmitOrder}>
							<div className="form-section">
								<h3 className="section-title"><span className="section-icon">👤</span> Thông tin khách hàng</h3>
								<div className="form-row">
									<div className="form-group">
										<label htmlFor="fullName">Họ và tên *</label>
										<input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`form-input ${errors.fullName ? 'error' : ''}`} placeholder="Nhập họ và tên" />
										{errors.fullName && <span className="error-message">{errors.fullName}</span>}
									</div>
									<div className="form-group">
										<label htmlFor="phone">Số điện thoại *</label>
										<input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="Nhập số điện thoại" />
										{errors.phone && <span className="error-message">{errors.phone}</span>}
									</div>
								</div>

								{/* Email removed from checkout form (optional) */}
							</div>

							<div className="form-section">
								<h3 className="section-title"><span className="section-icon">🏠</span> Địa chỉ giao hàng</h3>
								<div className="form-group">
									<label htmlFor="receiverName">Tên người nhận *</label>
									<input id="receiverName" name="receiverName" value={formData.receiverName} onChange={handleInputChange} className={`form-input ${errors.receiverName ? 'error' : ''}`} placeholder="Nhập tên người nhận hàng" />
									{errors.receiverName && <span className="error-message">{errors.receiverName}</span>}
								</div>

								<div className="form-group">
									<label htmlFor="receiverPhone">Số điện thoại người nhận *</label>
									<input id="receiverPhone" name="receiverPhone" value={formData.receiverPhone} onChange={handleInputChange} className={`form-input ${errors.receiverPhone ? 'error' : ''}`} placeholder="Nhập số điện thoại người nhận" />
									{errors.receiverPhone && <span className="error-message">{errors.receiverPhone}</span>}
								</div>

								<div className="form-group">
									<label htmlFor="deliveryTime">Ngày giờ nhận hàng *</label>
									<DatePicker
										id="deliveryTime"
										name="deliveryTime"
										selected={formData.deliveryTime}
										onChange={handleDateChange}
										showTimeSelect
										timeFormat="HH:mm"
										timeIntervals={15}
										dateFormat="dd/MM/yyyy HH:mm"
										timeCaption="Giờ"
										className={`form-input ${errors.deliveryTime ? 'error' : ''}`}
										placeholderText="Chọn ngày giờ nhận hàng"
										locale="vi"
									/>
									{errors.deliveryTime && <span className="error-message">{errors.deliveryTime}</span>}
									{formData.deliveryTime && <div style={{marginTop: 4, color: '#2ecc40', fontSize: 13}}>Đã chọn: {formatVietnamTime(formData.deliveryTime)}</div>}
								</div>

								<div className="form-group">
									<label htmlFor="address">Địa chỉ cụ thể *</label>
									<input id="address" name="address" value={formData.address} onChange={handleInputChange} className={`form-input ${errors.address ? 'error' : ''}`} placeholder="Số nhà, tên đường" />
									{errors.address && <span className="error-message">{errors.address}</span>}
								</div>

								<div className="form-row">
									<div className="form-group">
										<label htmlFor="district">Quận/Huyện *</label>
										<input id="district" name="district" value={formData.district} onChange={handleInputChange} className={`form-input ${errors.district ? 'error' : ''}`} placeholder="Nhập quận/huyện" />
										{errors.district && <span className="error-message">{errors.district}</span>}
									</div>
									<div className="form-group">
										<label htmlFor="city">Tỉnh/Thành phố *</label>
										<input id="city" name="city" value={formData.city} onChange={handleInputChange} className={`form-input ${errors.city ? 'error' : ''}`} placeholder="Nhập tỉnh/thành phố" />
										{errors.city && <span className="error-message">{errors.city}</span>}
									</div>
								</div>

								<div className="form-group">
									<label htmlFor="notes">Ghi chú (tùy chọn)</label>
									<textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="form-textarea" placeholder="Ghi chú cho đơn hàng (tùy chọn)" rows="3" />
								</div>
							</div>

							<div className="form-section">
								<h3 className="section-title"><span className="section-icon">💳</span> Phương thức thanh toán</h3>
								<div className="payment-methods">
									<label className="payment-option">
										<input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} />
										<span className="payment-label">
											<span className="payment-icon">💰</span>
											<div>
												<strong>Thanh toán khi nhận hàng (COD)</strong>
												<p>Thanh toán bằng tiền mặt khi nhận hàng</p>
											</div>
										</span>
									</label>
									<label className="payment-option disabled">
										<input type="radio" name="paymentMethod" value="bank" disabled />
										<span className="payment-label">
											<span className="payment-icon">🏦</span>
											<div>
												<strong>Chuyển khoản ngân hàng</strong>
												<p>Sẽ có sớm (đang phát triển)</p>
											</div>
										</span>
									</label>
								</div>
							</div>

							<div className="form-actions">
								<button type="button" className="back-btn" onClick={() => navigate('/cart')}>← Quay lại giỏ hàng</button>
								<button type="submit" className="submit-btn" disabled={loading}>{loading ? (<><span className="loading-spinner"></span>Đang xử lý...</>) : (`Đặt hàng - ${formatPrice(getCartTotal())}`)}</button>
							</div>
						</form>
					</div>

					<div className="order-summary">
						<div className="summary-card">
							<h3>Đơn hàng của bạn</h3>

							<div className="order-items">
								{cart.map(item => (
									<div key={item.product_id} className="order-item">
										<div className="item-info">
											<img src={normalizeImageUrl(item.image_url || item.image)} alt={item.name} className="item-image" />
											<div className="item-details">
												<h4>{item.name}</h4>
												<p>Số lượng: {item.quantity}</p>
											</div>
										</div>
										<div className="item-price">{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}</div>
									</div>
								))}
							</div>

							<div className="summary-divider" />
							<div className="summary-rows">
								<div className="summary-row"><span>Tạm tính ({cart.length} sản phẩm)</span><span>{formatPrice(getCartTotal())}</span></div>
								<div className="summary-row"><span>Phí vận chuyển</span><span className="free">Miễn phí</span></div>
								<div className="summary-row total"><span>Tổng cộng</span><span>{formatPrice(getCartTotal())}</span></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
