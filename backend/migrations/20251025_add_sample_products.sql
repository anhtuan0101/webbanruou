-- Thêm một số sản phẩm mẫu cho từng danh mục

-- Trái cây nhập khẩu (category_id = 1)
INSERT INTO products (category_id, supplier_id, name, price, description, stock, image_url) VALUES
(1, 1, 'Táo Envy Mỹ', 189000, 'Táo Envy của Mỹ có vỏ màu đỏ đậm, thịt giòn ngọt đậm đà', 50, '/uploads/tao-envy.jpg'),
(1, 1, 'Nho đỏ không hạt Úc', 245000, 'Nho đỏ không hạt Úc - Ngọt đậm, không hạt, được trồng tại Úc', 30, '/uploads/nho-do-uc.jpg'),
(1, 1, 'Lê Nashi Hàn Quốc', 195000, 'Lê Nashi Hàn Quốc - Mọng nước, ngọt thanh', 40, '/uploads/le-nashi.jpg');

-- Trái cây Việt Nam (category_id = 5)
INSERT INTO products (category_id, supplier_id, name, price, description, stock, image_url) VALUES
(5, 1, 'Sầu riêng Ri6 Đăk Lăk', 165000, 'Sầu riêng Ri6 thượng hạng từ Đăk Lăk - Múi dày, hạt lép', 20, '/uploads/sau-rieng.jpg'),
(5, 1, 'Bưởi da xanh Bến Tre', 89000, 'Bưởi da xanh Bến Tre - Múi hồng đậm, vị ngọt thanh', 45, '/uploads/buoi-da-xanh.jpg'),
(5, 1, 'Măng cụt Cái Mơn', 120000, 'Măng cụt Cái Mơn - Vỏ mỏng, cơm dày, vị ngọt đậm đà', 35, '/uploads/mang-cut.jpg');

-- Giỏ trái cây (category_id = 2)
INSERT INTO products (category_id, supplier_id, name, price, description, stock, image_url) VALUES
(2, 1, 'Giỏ trái cây thăm bệnh', 599000, 'Giỏ trái cây phù hợp thăm bệnh, thăm hỏi người thân', 10, '/uploads/gio-trai-cay-tham-benh.jpg'),
(2, 1, 'Giỏ trái cây sang trọng', 999000, 'Giỏ trái cây cao cấp phù hợp biếu tặng sếp, đối tác', 8, '/uploads/gio-trai-cay-sang-trong.jpg'),
(2, 1, 'Giỏ trái cây thắp hương', 499000, 'Giỏ trái cây thắp hương ngày lễ, ngày giỗ', 15, '/uploads/gio-trai-cay-thap-huong.jpg');

-- Hoa tươi (category_id = 3)
INSERT INTO products (category_id, supplier_id, name, price, description, stock, image_url) VALUES
(3, 1, 'Hoa hồng Ecuador', 950000, 'Bó hoa hồng Ecuador - Màu đỏ rực rỡ, cành dài 1m', 10, '/uploads/hoa-hong-ecuador.jpg'),
(3, 1, 'Hoa ly trắng', 450000, 'Bình hoa ly trắng tinh khôi - Phù hợp trang trí, thờ cúng', 15, '/uploads/hoa-ly-trang.jpg'),
(3, 1, 'Lan hồ điệp trắng', 1200000, 'Chậu lan hồ điệp trắng - 15 cành', 5, '/uploads/lan-ho-diep.jpg');