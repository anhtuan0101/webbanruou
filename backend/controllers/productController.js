// Lấy các sản phẩm nổi bật (mặc định: mới nhất, giới hạn 8)
exports.getFeatured = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const [rows] = await pool.query(`
      SELECT p.*, p.image_url, c.name as category_name, s.name as supplier_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.category_id 
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [limit]);
    res.json(rows);
  } catch (err) { next(err); }
};
// backend/controllers/productController.js
const pool = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { category_id, supplier_id, name, price, stock, description, image_url } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (category_id, supplier_id, name, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category_id || null, supplier_id || null, name, price, stock || 0, description || null, image_url || null]
    );
    res.json({ message: 'Thêm thành công', product_id: result.insertId });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { category_id, supplier_id, name, price, stock, description, image_url } = req.body;
    await pool.query(
      'UPDATE products SET category_id=?, supplier_id=?, name=?, price=?, stock=?, description=?, image_url=? WHERE product_id=?',
      [category_id || null, supplier_id || null, name, price, stock || 0, description || null, image_url || null, id]
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) { next(err); }
};


exports.delete = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
    res.json({ message: 'Xóa thành công' });
  } catch (err) { next(err); }
};

// API: /products/stats
exports.getStats = async (req, res, next) => {
  try {
    // Tổng số sản phẩm
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM products');
    // Sản phẩm sắp hết hàng (ví dụ: stock <= 5)
    const [lowStockRows] = await pool.query('SELECT COUNT(*) as lowStock FROM products WHERE stock <= 5');
    // Tổng số loại sản phẩm
    const [categoryRows] = await pool.query('SELECT COUNT(DISTINCT category_id) as categories FROM products');
    res.json({
      total: totalRows[0].total,
      lowStock: lowStockRows[0].lowStock,
      categories: categoryRows[0].categories
    });
  } catch (err) {
    next(err);
  }
};
