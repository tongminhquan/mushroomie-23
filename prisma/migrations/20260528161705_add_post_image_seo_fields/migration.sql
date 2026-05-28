-- AlterTable
ALTER TABLE `posts` ADD COLUMN `featured_image_alt` VARCHAR(191) NULL,
    ADD COLUMN `featured_image_caption` TEXT NULL,
    ADD COLUMN `featured_image_description` TEXT NULL;
