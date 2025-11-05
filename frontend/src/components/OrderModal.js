import React from 'react';
import { useNavigate } from 'react-router-dom';
import formatPrice from '../utils/formatPrice';
import './OrderModal.css';

function formatVietnamTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OrderModal({ show, onClose, orderId, lastOrderPayload }) {
  const navigate = useNavigate();
  if (!show) return null;

  return (
    <div className="rf-modal-backdrop">
      <div className="rf-modal">
        <h2 className="rf-modal-title">Đặt hàng thành công!</h2>
        <p className="rf-modal-sub">Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là:</p>
        <p className="rf-modal-order">#{orderId}</p>

        {lastOrderPayload && (
          <div className="rf-modal-details">
            <h4>Chi tiết đơn hàng</h4>
            <ul className="rf-order-items">
              {lastOrderPayload.items.map((it, idx) => (
                <li key={idx} className="rf-order-item">
                  <span>{it.product_id} — SL: {it.quantity}</span>
                  <span>{formatPrice((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                </li>
              ))}
            </ul>

            <div className="rf-order-summary"><strong>Tổng:</strong> {formatPrice(lastOrderPayload.total_amount)}</div>
            <div><strong>Người nhận:</strong> {lastOrderPayload.customer_info.receiver_name}</div>
            <div><strong>SĐT người nhận:</strong> {lastOrderPayload.customer_info.receiver_phone}</div>
            <div><strong>Địa chỉ:</strong> {lastOrderPayload.customer_info.address}</div>
            <div><strong>Ngày giờ nhận:</strong> {lastOrderPayload.customer_info.delivery_time ? formatVietnamTime(lastOrderPayload.customer_info.delivery_time) : '(Không)'}</div>
          </div>
        )}

        <div className="rf-modal-actions">
          <button className="submit-btn" onClick={() => { onClose(); navigate('/'); }}>Quay về trang chủ</button>
          <button className="back-btn" onClick={() => { onClose(); navigate('/orders'); }}>Xem đơn hàng</button>
        </div>

        <button className="rf-modal-close" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
