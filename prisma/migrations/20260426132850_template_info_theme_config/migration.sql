-- AlterTable
ALTER TABLE `Invitation` ADD COLUMN `templateConfigJson` JSON NULL;

-- AlterTable
ALTER TABLE `Template` ADD COLUMN `infoConfig` JSON NULL,
    ADD COLUMN `themeConfig` JSON NULL;
