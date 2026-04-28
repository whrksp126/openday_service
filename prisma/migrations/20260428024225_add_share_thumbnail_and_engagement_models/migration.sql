-- AlterTable
ALTER TABLE `Invitation` ADD COLUMN `kakaoShareExtra` TEXT NULL,
    ADD COLUMN `kakaoShareText` TEXT NULL,
    ADD COLUMN `kakaoShareTitle` VARCHAR(191) NULL,
    ADD COLUMN `linkShareText` TEXT NULL,
    ADD COLUMN `linkShareTitle` VARCHAR(191) NULL,
    ADD COLUMN `thumbnailUrl` VARCHAR(191) NULL,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `GuestbookEntry` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuestbookEntry_invitationId_createdAt_idx`(`invitationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RsvpResponse` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `guestName` VARCHAR(191) NOT NULL,
    `side` VARCHAR(191) NULL,
    `attending` BOOLEAN NOT NULL,
    `partySize` INTEGER NOT NULL DEFAULT 1,
    `meal` BOOLEAN NULL,
    `phone` VARCHAR(191) NULL,
    `message` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RsvpResponse_invitationId_createdAt_idx`(`invitationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisitLog` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `visitorHash` VARCHAR(191) NOT NULL,
    `referer` VARCHAR(191) NULL,
    `visitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VisitLog_invitationId_visitedAt_idx`(`invitationId`, `visitedAt`),
    INDEX `VisitLog_invitationId_visitorHash_idx`(`invitationId`, `visitorHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoupleInvite` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'editor',
    `acceptedById` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CoupleInvite_token_key`(`token`),
    INDEX `CoupleInvite_invitationId_idx`(`invitationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GuestbookEntry` ADD CONSTRAINT `GuestbookEntry_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RsvpResponse` ADD CONSTRAINT `RsvpResponse_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisitLog` ADD CONSTRAINT `VisitLog_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoupleInvite` ADD CONSTRAINT `CoupleInvite_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoupleInvite` ADD CONSTRAINT `CoupleInvite_acceptedById_fkey` FOREIGN KEY (`acceptedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
