// API: /orders/stats
exports.getStats = async (req, res, next) => {
  try {
    // Tổng số đơn
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM orders');
    // Tổng doanh thu hôm nay
    const [todayRevenueRows] = await pool.query("SELECT SUM(total) as revenue, COUNT(*) as count FROM orders WHERE DATE(order_date) = CURDATE()");
    // Tổng doanh thu tháng này
    const [monthRevenueRows] = await pool.query("SELECT SUM(total) as revenue, COUNT(*) as count FROM orders WHERE YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE())");
    res.json({
      totalOrders: totalRows[0].total,
      today: {
        revenue: todayRevenueRows[0].revenue || 0,
        count: todayRevenueRows[0].count || 0
      },
      month: {
        revenue: monthRevenueRows[0].revenue || 0,
        count: monthRevenueRows[0].count || 0
      }
    });
  } catch (err) {
    next(err);
  }
};
// backend/controllers/orderController.js
const pool = require('../config/db');
const emailService = require('../utils/emailService');
const { sendOrderNotificationToZalo } = require('../utils/zaloService');

exports.createOrder = async (req, res, next) => {
  try {
    // Log incoming payload and headers to help debug validation issues
    try { console.log('createOrder incoming headers:', JSON.stringify(req.headers)); } catch (_) {}
    try { console.log('createOrder incoming content-type:', req.get('content-type')); } catch (_) {}
    try { console.log('createOrder incoming body:', JSON.stringify(req.body)); } catch (_) {}

    const { items, shipping_address } = req.body || {};
    let customer_info = req.body ? req.body.customer_info : undefined; // customer_info: { full_name, phone, address, notes }

    // Defensive: if customer_info comes as a JSON string, try parse it
    if (typeof customer_info === 'string') {
      try {
        customer_info = JSON.parse(customer_info);
        console.log('createOrder: parsed customer_info from string');
      } catch (e) {
        console.error('createOrder: failed to parse customer_info string', e.message);
      }
    }

    // Basic validation and clearer error messages
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('createOrder: invalid items payload:', items);
      return res.status(400).json({ message: 'Danh sách sản phẩm trống' });
    }
    if (!customer_info || typeof customer_info !== 'object') {
      console.error('createOrder: missing or invalid customer_info in request body:', req.body);
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin khách hàng' });
    }
    // require at least a phone or full_name
    if ((!customer_info.phone || !String(customer_info.phone).trim()) && (!customer_info.full_name || !String(customer_info.full_name).trim())) {
      console.error('createOrder: missing customer phone and name:', customer_info);
      return res.status(400).json({ message: 'Vui lòng cung cấp tên hoặc số điện thoại khách hàng' });
    }
    let customer_id = null;
    let customer_name = '';
    let customer_email = '';
    let customer_phone = '';

    if (req.user && typeof req.user === 'object' && req.user.user_id) {
      // Đã đăng nhập
      const user_id = req.user.user_id;
      const [cusRows] = await pool.query('SELECT customer_id, name, email, phone FROM customers WHERE user_id = ?', [user_id]);
      if (!cusRows.length) {
        return res.status(400).json({ message: 'Không tìm thấy thông tin khách hàng' });
      }
      customer_id = cusRows[0].customer_id;
      customer_name = cusRows[0].name;
      customer_email = cusRows[0].email;
      customer_phone = cusRows[0].phone;
    } else {
      // Khách chưa đăng nhập: email bây giờ là tùy chọn.
      if (!customer_info || typeof customer_info !== 'object') {
        console.error('createOrder: missing or invalid customer_info in request body:', req.body);
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin khách hàng' });
      }

      // Prefer tìm theo email nếu có, nếu không có email thì tìm theo phone
      let cusRows = [];
      if (customer_info.email) {
        [cusRows] = await pool.query('SELECT customer_id, name, email, phone FROM customers WHERE email = ?', [customer_info.email]);
      }

      if ((!cusRows || cusRows.length === 0) && customer_info.phone) {
        const [byPhone] = await pool.query('SELECT customer_id, name, email, phone FROM customers WHERE phone = ?', [customer_info.phone]);
        if (byPhone && byPhone.length) cusRows = byPhone;
      }

      if (cusRows && cusRows.length) {
        customer_id = cusRows[0].customer_id;
        customer_name = cusRows[0].name;
        customer_email = cusRows[0].email;
        customer_phone = cusRows[0].phone;
      } else {
        // Tạo mới customer; cho phép email null
        const insertEmail = customer_info.email && customer_info.email.trim() ? customer_info.email.trim() : null;
        const insertPhone = customer_info.phone && customer_info.phone.trim() ? customer_info.phone.trim() : null;
        const insertAddress = customer_info.address || null;

        const [result] = await pool.query(
          'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
          [customer_info.full_name, insertEmail, insertPhone, insertAddress]
        );
        customer_id = result.insertId;
        customer_name = customer_info.full_name;
        customer_email = insertEmail;
        customer_phone = insertPhone;
      }
    }

    // Tính tổng tiền
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Tạo order với đầy đủ thông tin giao hàng
    // Lưu số điện thoại người nhận riêng (nếu có)
    const [orderResult] = await pool.query(
      'INSERT INTO orders (customer_id, total, status, receiver_name, receiver_phone, delivery_time, shipping_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        customer_id,
        total,
        'pending',
        customer_info.receiver_name || customer_name,
        customer_info.receiver_phone || customer_info.phone || customer_phone,
        customer_info.delivery_time || null,
        customer_info.address || null
      ]
    );
    const orderId = orderResult.insertId;

    // Thêm order items và cập nhật stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await pool.query(
        'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Lấy thông tin chi tiết đơn hàng để gửi email
    const [orderDetails] = await pool.query(`
      SELECT o.*, c.email, c.name as customer_name, c.phone,
        o.receiver_name, o.receiver_phone, o.delivery_time, o.shipping_address,
        GROUP_CONCAT(
          CONCAT('{"name":"', p.name, '","quantity":', oi.quantity, ',"price":', oi.price, '}')
          SEPARATOR ','
        ) as items_json
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.order_id = ?
      GROUP BY o.order_id
    `, [orderId]);

    if (orderDetails.length > 0) {
      const order = orderDetails[0];
      const orderData = {
        order_id: orderId,
        total_amount: order.total,
        created_at: order.created_at,
        customer_name: order.customer_name,
        phone: order.phone,
        email: order.email,
        address: order.shipping_address || '',
        receiver_name: order.receiver_name || order.customer_name || '',
        receiver_phone: order.receiver_phone || order.phone,
        delivery_time: order.delivery_time || '',
        items: JSON.parse(`[${order.items_json}]`)
      };

      // Gửi email thông báo cho admin
      try {
        await emailService.sendNewOrderNotification(orderData);
        console.log('Admin notification email sent successfully');
        // Gửi thông báo về Zalo OA admin
        sendOrderNotificationToZalo(orderData);
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }

      // Gửi email xác nhận cho khách hàng (chỉ khi có email)
      if (order.email) {
        try {
          await emailService.sendOrderConfirmation(orderData, order.email);
          console.log('Customer confirmation email sent successfully');
        } catch (emailError) {
          console.error('Failed to send customer confirmation:', emailError);
        }
      } else {
        console.log('No customer email provided - skipping customer confirmation email');
      }
    }

    res.json({ message: 'Đặt hàng thành công', order_id: orderId });
  } catch (err) {
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    }
    const user_id = req.user.user_id;
    // Lấy customer_id từ user_id
    const [cusRows] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [user_id]);
    if (!cusRows.length) return res.json([]);
    const customer_id = cusRows[0].customer_id;
    // Lấy orders với thông tin chi tiết
    const [orders] = await pool.query(`
      SELECT o.*, 
        GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `, [customer_id]);
    res.json(orders);
  } catch (err) { 
    next(err); 
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, c.name as customer_name, c.email as customer_email,
        GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `);
    res.json(rows);
  } catch (err) { 
    next(err); 
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, id]);
    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (err) {
    next(err);
  }
};
