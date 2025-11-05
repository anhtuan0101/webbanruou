import React from 'react';

import { Link } from 'react-router-dom';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaRegClock } from 'react-icons/fa';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Cột logo + giới thiệu */}
        <div className="footer-section">
          <div className="footer-logo">
            <img src={require('../assets/LOGO.png')} alt="FruitShop Logo" className="logo-img" style={{width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))'}} />
            <h2 className="logo-title">Oanh Fruits & Flower</h2>
          </div>
          <p className="footer-subtitle">TRÁI CÂY TƯƠI NGON</p>
          <p className="footer-description">
            Cung cấp những loại trái cây tươi ngon và chất lượng cao nhất 
            từ các vùng miền khắp Việt Nam và thế giới.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <FaYoutube />
            </a>
            <a href="#" className="social-link" aria-label="Zalo" style={{padding:0}}>
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="8" fill="#0180C7"/>
                <path d="M24.1 13.5c-6.1 0-11 4.1-11 9.2 0 2.7 1.5 5.1 3.9 6.8l-1.1 3.6c-.1.3.2.6.5.5l3.7-1.2c1.1.3 2.3.5 3.5.5 6.1 0 11-4.1 11-9.2s-4.9-9.2-11-9.2z" fill="#fff"/>
                <path d="M18.7 27.2c.2-.2.2-.5 0-.7l-1.2-1.2c-.2-.2-.5-.2-.7 0s-.2.5 0 .7l1.2 1.2c.2.2.5.2.7 0zm2.6-2.6c.2-.2.2-.5 0-.7l-3.8-3.8c-.2-.2-.5-.2-.7 0s-.2.5 0 .7l3.8 3.8c.2.2.5.2.7 0zm2.6-2.6c.2-.2.2-.5 0-.7l-1.2-1.2c-.2-.2-.5-.2-.7 0s-.2.5 0 .7l1.2 1.2c.2.2.5.2.7 0zm2.6-2.6c.2-.2.2-.5 0-.7l-3.8-3.8c-.2-.2-.5-.2-.7 0s-.2.5 0 .7l3.8 3.8c.2.2.5.2.7 0z" fill="#0180C7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Liên kết nhanh */}
        <div className="footer-section">
          <h3 className="section-title">Liên Kết Nhanh</h3>
          <ul className="footer-links">
            <li><Link to="/">Trang Chủ</Link></li>
            <li><Link to="/products">Sản Phẩm</Link></li>
            <li><Link to="/categories">Danh Mục</Link></li>
            <li><Link to="/about">Giới Thiệu</Link></li>
            <li><Link to="/contact">Liên Hệ</Link></li>
          </ul>
        </div>

        {/* Dịch vụ khách hàng */}
        <div className="footer-section">
          <h3 className="section-title">Dịch Vụ Khách Hàng</h3>
          <ul className="footer-links">
            <li><a href="/faq">Hỏi Đáp</a></li>
            <li><a href="/shipping">Chính Sách Vận Chuyển</a></li>
            <li><a href="/returns">Đổi Trả & Hoàn Tiền</a></li>
            <li><a href="/privacy">Chính Sách Bảo Mật</a></li>
            <li><a href="/terms">Điều Khoản Dịch Vụ</a></li>
          </ul>
        </div>

        {/* Thông tin liên hệ */}
        <div className="footer-section">
          <h3 className="section-title">Thông Tin Liên Hệ</h3>
          <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon"><FaMapMarkerAlt /></span>
                    <span>170 Nguyễn Duy Cung, phường An Hội Tây, TPHCM (Gò Vấp cũ)</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon"><FaPhoneAlt /></span>
                    <a href="tel:0979347931">0979 347 931</a>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon"><FaEnvelope /></span>
                    <a href="mailto:info@fruitshop.com">info@fruitshop.com</a>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon"><FaRegClock /></span>
                    <span>6:00 - 22:00 (<span style={{ color: '#4ade80' }}>Hàng ngày</span>)</span>
                  </div>
          </div>
                 <a
                   href="https://zalo.me/0979347931"
                   className="contact-cta"
                   target="_blank"
                   rel="noopener noreferrer"
                 >
                   Liên hệ với chúng tôi qua Zalo →
                 </a>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© {currentYear} Fruit Shop. Tất cả quyền được bảo lưu.</p>
          <div className="footer-bottom-links">
            <a href="/terms">Điều khoản</a>
            <span className="separator">•</span>
            <a href="/privacy">Bảo mật</a>
            <span className="separator">•</span>
            <a href="/sitemap">Sơ đồ trang</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

