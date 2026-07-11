-- Allow a user to receive multiple instances when a voucher explicitly sets perUserLimit > 1.
DROP INDEX `user_vouchers_userId_voucherId_key` ON `user_vouchers`;
CREATE INDEX `user_vouchers_userId_voucherId_idx` ON `user_vouchers`(`userId`, `voucherId`);

-- Persist score-session consumption so replay protection survives restarts and multiple PM2 workers.
ALTER TABLE `game_scores`
  ADD COLUMN `session_token_hash` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `game_scores_session_token_hash_key` ON `game_scores`(`session_token_hash`);

-- Shared rate-limit state for authentication and other sensitive endpoints.
CREATE TABLE `rate_limit_buckets` (
  `key` VARCHAR(64) NOT NULL,
  `count` INTEGER NOT NULL DEFAULT 0,
  `reset_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `rate_limit_buckets_reset_at_idx`(`reset_at`),
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
