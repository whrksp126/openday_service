-- AlterTable
ALTER TABLE `Invitation` ADD COLUMN `driveFolderId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `InvitationDriveLink` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `googleAccountId` VARCHAR(191) NOT NULL,
    `scope` TEXT NOT NULL,
    `refreshToken` TEXT NOT NULL,
    `accessToken` TEXT NULL,
    `accessExpiresAt` DATETIME(3) NULL,
    `driveFolderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvitationDriveLink_invitationId_key`(`invitationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhotoShareSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `relation` VARCHAR(191) NOT NULL,
    `driveFileId` VARCHAR(191) NOT NULL,
    `driveThumbnailUrl` TEXT NULL,
    `driveDirectUrl` TEXT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `deleteTokenHash` VARCHAR(191) NOT NULL,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhotoShareSubmission_invitationId_createdAt_idx`(`invitationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InvitationDriveLink` ADD CONSTRAINT `InvitationDriveLink_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhotoShareSubmission` ADD CONSTRAINT `PhotoShareSubmission_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
