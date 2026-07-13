-- ── photo_share 모듈을 invitation 단위에서 모듈 인스턴스 단위로 분리 ────────
--
-- 1) InvitationDriveLink: invitationId 단일 unique → (invitationId, moduleId) composite unique
--    moduleId 는 modulesJson 의 첫 photo_share 모듈 id 로 backfill
-- 2) PhotoShareSubmission: 동일하게 invitationId → (invitationId, moduleId) 인덱싱
-- 3) Invitation.driveFolderId 컬럼 제거 (모듈별로 InvitationDriveLink.driveFolderId 가 보유)

-- Step 1. moduleId 컬럼 nullable 로 추가
ALTER TABLE `InvitationDriveLink` ADD COLUMN `moduleId` VARCHAR(191) NULL;
ALTER TABLE `PhotoShareSubmission` ADD COLUMN `moduleId` VARCHAR(191) NULL;

-- Step 2. 기존 데이터 backfill — modulesJson 에서 첫 photo_share 모듈의 id 를 추출
--   JSON_SEARCH 는 types 배열에서 'photo_share' 의 경로(예: "$[16]") 를 반환.
--   거기에 '.id' 를 붙여 같은 인덱스의 모듈 id 를 꺼낸다.
UPDATE `InvitationDriveLink` dl
JOIN `Invitation` i ON i.id = dl.invitationId
SET dl.moduleId = JSON_UNQUOTE(JSON_EXTRACT(
    i.modulesJson,
    CONCAT(
      JSON_UNQUOTE(JSON_SEARCH(JSON_EXTRACT(i.modulesJson, '$[*].type'), 'one', 'photo_share')),
      '.id'
    )
  ))
WHERE dl.moduleId IS NULL
  AND JSON_SEARCH(JSON_EXTRACT(i.modulesJson, '$[*].type'), 'one', 'photo_share') IS NOT NULL;

UPDATE `PhotoShareSubmission` ps
JOIN `Invitation` i ON i.id = ps.invitationId
SET ps.moduleId = JSON_UNQUOTE(JSON_EXTRACT(
    i.modulesJson,
    CONCAT(
      JSON_UNQUOTE(JSON_SEARCH(JSON_EXTRACT(i.modulesJson, '$[*].type'), 'one', 'photo_share')),
      '.id'
    )
  ))
WHERE ps.moduleId IS NULL
  AND JSON_SEARCH(JSON_EXTRACT(i.modulesJson, '$[*].type'), 'one', 'photo_share') IS NOT NULL;

-- backfill 실패한 row 는 placeholder 값으로 채워 NOT NULL 제약을 통과시킨다.
-- (운영자가 데이터 정리 후 수동 처리)
UPDATE `InvitationDriveLink` SET `moduleId` = CONCAT('orphan-', id) WHERE `moduleId` IS NULL;
UPDATE `PhotoShareSubmission` SET `moduleId` = CONCAT('orphan-', id) WHERE `moduleId` IS NULL;

-- Step 3. NOT NULL + 인덱스 변경
ALTER TABLE `InvitationDriveLink` MODIFY `moduleId` VARCHAR(191) NOT NULL;
ALTER TABLE `PhotoShareSubmission` MODIFY `moduleId` VARCHAR(191) NOT NULL;

-- 기존 unique 제거 + 새 composite unique 추가
-- FK 가 invitationId 인덱스를 참조하므로 잠시 제거했다가 재생성한다.
ALTER TABLE `InvitationDriveLink` DROP FOREIGN KEY `InvitationDriveLink_invitationId_fkey`;
DROP INDEX `InvitationDriveLink_invitationId_key` ON `InvitationDriveLink`;
CREATE UNIQUE INDEX `InvitationDriveLink_invitationId_moduleId_key` ON `InvitationDriveLink`(`invitationId`, `moduleId`);
CREATE INDEX `InvitationDriveLink_invitationId_idx` ON `InvitationDriveLink`(`invitationId`);
ALTER TABLE `InvitationDriveLink`
  ADD CONSTRAINT `InvitationDriveLink_invitationId_fkey`
  FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- PhotoShareSubmission 인덱스 갱신 (FK 가 invitationId 인덱스를 참조)
ALTER TABLE `PhotoShareSubmission` DROP FOREIGN KEY `PhotoShareSubmission_invitationId_fkey`;
DROP INDEX `PhotoShareSubmission_invitationId_createdAt_idx` ON `PhotoShareSubmission`;
CREATE INDEX `PhotoShareSubmission_invitationId_moduleId_createdAt_idx` ON `PhotoShareSubmission`(`invitationId`, `moduleId`, `createdAt`);
ALTER TABLE `PhotoShareSubmission`
  ADD CONSTRAINT `PhotoShareSubmission_invitationId_fkey`
  FOREIGN KEY (`invitationId`) REFERENCES `Invitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4. Invitation.driveFolderId 컬럼 제거
ALTER TABLE `Invitation` DROP COLUMN `driveFolderId`;
