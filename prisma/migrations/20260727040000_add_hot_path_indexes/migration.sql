-- Index cho các truy vấn nóng.
--
-- Audit 2026-07-27: posts, products, reviews, orders và email_logs không có index nào
-- ngoài UNIQUE trên slug/sku. Mọi truy vấn lọc theo `status` hoặc sắp xếp theo
-- `published_at` đều phải full table scan kèm filesort.
--
-- Toàn bộ là thao tác additive (CREATE INDEX), không đụng dữ liệu, không khoá ghi lâu
-- trên MySQL 8 (ALGORITHM=INPLACE mặc định cho secondary index).
--
-- Hai index trên orders/email_logs là bắt buộc cho cron /api/cron/review-requests:
-- hai bảng đó tăng không giới hạn theo thời gian, khác với posts/products.

-- posts: danh sách bài đã xuất bản, sắp xếp theo ngày đăng (/tin-tuc, related posts)
CREATE INDEX `posts_status_published_at_idx` ON `posts`(`status`, `published_at`);
CREATE INDEX `posts_category_id_status_idx` ON `posts`(`category_id`, `status`);
CREATE INDEX `posts_author_id_idx` ON `posts`(`author_id`);

-- products: danh sách sản phẩm đang bán (/san-pham, gợi ý sản phẩm trong bài viết)
CREATE INDEX `products_status_created_at_idx` ON `products`(`status`, `created_at`);
CREATE INDEX `products_category_id_status_idx` ON `products`(`category_id`, `status`);

-- reviews: đánh giá đã duyệt của một sản phẩm (dùng cho aggregateRating trong schema)
CREATE INDEX `reviews_product_id_status_idx` ON `reviews`(`product_id`, `status`);
CREATE INDEX `reviews_status_is_featured_idx` ON `reviews`(`status`, `is_featured`);

-- orders: cron quét đơn COMPLETED chưa đánh giá; tra cứu đơn theo user và theo email
CREATE INDEX `orders_order_status_is_reviewed_updated_at_idx` ON `orders`(`order_status`, `is_reviewed`, `updated_at`);
CREATE INDEX `orders_user_id_idx` ON `orders`(`user_id`);
CREATE INDEX `orders_customer_email_idx` ON `orders`(`customer_email`);

-- email_logs: chống gửi trùng và tra opt-out theo email
CREATE INDEX `email_logs_template_key_recipient_email_idx` ON `email_logs`(`template_key`, `recipient_email`);
CREATE INDEX `email_logs_order_id_idx` ON `email_logs`(`order_id`);
