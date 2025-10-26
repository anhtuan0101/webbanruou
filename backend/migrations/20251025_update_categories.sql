-- Thêm danh mục mới: Trái cây Việt Nam
INSERT INTO categories (name, description) 
VALUES ('Trái cây Việt Nam', 'Các loại trái cây đặc sản Việt Nam tươi ngon, an toàn.');

-- Cập nhật mô tả chi tiết hơn cho các danh mục hiện có
UPDATE categories 
SET description = 'Trái cây nhập khẩu cao cấp từ Mỹ, Úc, New Zealand – đảm bảo chất lượng, nguồn gốc rõ ràng.'
WHERE category_id = 1;

UPDATE categories 
SET description = 'Các mẫu giỏ trái cây đẹp, sang trọng phù hợp biếu tặng, sự kiện.'
WHERE category_id = 2;

UPDATE categories 
SET description = 'Hoa tươi nhập khẩu và trong nước, thiết kế theo yêu cầu.'
WHERE category_id = 3;