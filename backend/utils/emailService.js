// backend/utils/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  // Format date string to Vietnam timezone (Asia/Ho_Chi_Minh)
  static formatVietnamTime(dateInput) {
    if (!dateInput) return '';
    try {
      let date = dateInput;
      if (typeof dateInput === 'string' && dateInput.includes('T')) {
        date = new Date(dateInput + (dateInput.endsWith('Z') ? '' : 'Z'));
        date = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      } else {
        date = new Date(dateInput);
      }
      // Format: dd/MM/yyyy HH:mm (24h, không SA/CH)
      const pad = n => n.toString().padStart(2, '0');
      return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    } catch (e) {
      return dateInput;
    }
  }
  constructor() {
   this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }

  // Gửi email thông báo đơn hàng mới cho admin
  async sendNewOrderNotification(orderData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'dangvanchuong2004@gmail.com',
        subject: `🛒 Đơn hàng mới #${orderData.order_id} - FruitShop`,
        html: this.generateOrderNotificationTemplate(orderData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Gửi email xác nhận đơn hàng cho khách hàng
  async sendOrderConfirmation(orderData, customerEmail) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: `✅ Xác nhận đơn hàng #${orderData.order_id} - FruitShop`,
        html: this.generateOrderConfirmationTemplate(orderData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Template email thông báo cho admin

  generateOrderNotificationTemplate(orderData) {
    const items = orderData.items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${this.formatPrice(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${this.formatPrice(item.price * item.quantity)}</td>
      </tr>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Đơn hàng mới</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0;">🍏 FRUITSHOP</h1>
          <h2 style="color: #333; margin: 10px 0;">Đơn hàng mới #${orderData.order_id}</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #ff6b35;">📋 Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> #${orderData.order_id}</p>
          <p><strong>Thời gian:</strong> ${EmailService.formatVietnamTime(orderData.created_at)}</p>
          <p><strong>Tổng tiền:</strong> <span style="color: #ff6b35; font-weight: bold; font-size: 18px;">${this.formatPrice(orderData.total_amount)}</span></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #ff6b35;">👤 Thông tin khách hàng</h3>
          <p><strong>Họ tên đặt hàng:</strong> ${orderData.customer_name}</p>
          <p><strong>Số điện thoại:</strong> <a href="tel:${orderData.phone}" style="color: #ff6b35;">${orderData.phone}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${orderData.email}" style="color: #ff6b35;">${orderData.email}</a></p>
          <p><strong>Địa chỉ nhận hàng:</strong> ${orderData.address || '(Không nhập)'}</p>g
          <p><strong>Người nhận hàng:</strong> ${orderData.receiver_name || '(Trùng người đặt)'}</p>
          <p><strong>SĐT người nhận:</strong> <a href="tel:${orderData.receiver_phone || orderData.phone}" style="color: #ff6b35;">${orderData.receiver_phone || orderData.phone || '(Không nhập)'}</a></p>
          <p><strong>Ngày giờ nhận hàng:</strong> ${orderData.delivery_time ? EmailService.formatVietnamTime(orderData.delivery_time) : '(Không chọn)'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff6b35;">🛒 Chi tiết sản phẩm</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #ff6b35; color: white;">
                <th style="padding: 12px; text-align: left;">Sản phẩm</th>
                <th style="padding: 12px; text-align: center;">SL</th>
                <th style="padding: 12px; text-align: right;">Đơn giá</th>
                <th style="padding: 12px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>
        </div>

        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #28a745; font-weight: bold;">💡 Hãy liên hệ khách hàng để xác nhận đơn hàng!</p>
          <p style="margin: 5px 0 0 0;">
            <a href="tel:${orderData.phone}" style="color: #28a745; text-decoration: none; margin-right: 20px;">📞 Gọi điện</a>
            <a href="https://zalo.me/${orderData.phone}" style="color: #0068ff; text-decoration: none;">💬 Chat Zalo</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">🍏 FruitShop - Fresh & Delicious</p>
          <p style="color: #666; font-size: 12px;">Email này được gửi tự động từ hệ thống</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Template email xác nhận cho khách hàng
  generateOrderConfirmationTemplate(orderData) {
    const items = orderData.items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${this.formatPrice(item.price * item.quantity)}</td>
      </tr>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Xác nhận đơn hàng</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0;">🍏 FRUITSHOP</h1>
          <h2 style="color: #28a745; margin: 10px 0;">✅ Đơn hàng đã được tiếp nhận!</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Chào <strong>${orderData.customer_name}</strong>,</p>
          <p>Cảm ơn bạn đã đặt hàng tại FruitShop! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.</p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #ff6b35;">📋 Thông tin đơn hàng #${orderData.order_id}</h3>
          <p><strong>Thời gian đặt:</strong> ${new Date(orderData.created_at).toLocaleString('vi-VN')}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${orderData.address}</p>
          <p><strong>Tổng tiền:</strong> <span style="color: #ff6b35; font-weight: bold; font-size: 18px;">${this.formatPrice(orderData.total_amount)}</span></p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #ff6b35;">🛒 Sản phẩm đã đặt</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #ff6b35; color: white;">
                <th style="padding: 12px; text-align: left;">Sản phẩm</th>
                <th style="padding: 12px; text-align: center;">Số lượng</th>
                <th style="padding: 12px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #28a745;">📞 Thông tin liên hệ</h3>
          <p>Chúng tôi sẽ liên hệ với bạn trong vòng 24h để xác nhận đơn hàng.</p>
          <p><strong>Hotline:</strong> <a href="tel:0977045133" style="color: #ff6b35;">0977 045 133</a></p>
          <p><strong>Zalo:</strong> <a href="https://zalo.me/0977045133" style="color: #0068ff;">Chat với chúng tôi</a></p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666;">🍏 Cảm ơn bạn đã tin tưởng FruitShop!</p>
          <p style="color: #666; font-size: 12px;">Fresh & Delicious - Tươi ngon mỗi ngày</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}

module.exports = new EmailService();