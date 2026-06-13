ALTER TABLE `payment_webhook_events` ADD COLUMN `amount` DECIMAL(12, 2) NULL;
ALTER TABLE `payment_webhook_events` ADD COLUMN `currency` VARCHAR(191) NULL DEFAULT 'VND';
ALTER TABLE `payment_webhook_events` ADD COLUMN `sanitized_headers` JSON NULL;
ALTER TABLE `payment_webhook_events` ADD COLUMN `message` TEXT NULL;
ALTER TABLE `payment_webhook_events` ADD COLUMN `ip_address` VARCHAR(191) NULL;
ALTER TABLE `payment_webhook_events` ADD COLUMN `user_agent` VARCHAR(191) NULL;
