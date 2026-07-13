// objectStore(MinIO 호환, https://objectstore.ghmate.com)의 `openday` 버킷 안에서
// 자산 종류별로 폴더 구조를 분리해 운영한다.
//
//   templates/{templateId}/...        템플릿 기본 자산 (모든 사용자가 공유, 읽기 전용)
//   presets/bgm/{category}/{file}     CC BY 라이선스 BGM 등 공용 프리셋
//   system/icons/...                  지도 마커 같은 시스템 자산
//   users/{userId}/invitations/{invitationId}/{file}
//                                     사용자 초대장에 귀속된 업로드 파일
//
// 이 분리로 다음을 보장:
//   - 사용자 계정 삭제 → users/{userId}/ 통째로 정리
//   - 초대장 삭제 → users/{userId}/invitations/{invitationId}/ 정리
//   - 템플릿 자산 갱신 → templates/{templateId}/ 안에서만
//
// 베이스 URL은 빌드 타임 상수(모든 환경 dev/stg/prod/local 동일 버킷). 이렇게 두면
// 클라이언트 컴포넌트도 NEXT_PUBLIC_ 환경 변수 없이 그대로 URL을 사용할 수 있다.
//
// 서버 사이드 업로드 URL 생성은 `src/lib/objectstore.ts`의 `getPublicUrl(key)`를 사용.

export const ASSET_BASE_URL = 'https://objectstore.ghmate.com/openday'

function join(...parts: string[]): string {
  return parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

/** 템플릿 자산 — `templates/{templateId}/{path}` */
export function templateAssetUrl(templateId: string, ...path: string[]): string {
  return `${ASSET_BASE_URL}/${join('templates', templateId, ...path)}`
}

/** 공용 프리셋 BGM — `presets/bgm/{category}/{file}` */
export function presetBgmUrl(category: string, file: string): string {
  return `${ASSET_BASE_URL}/${join('presets/bgm', category, file)}`
}

/** 시스템 자산 (지도 마커 등) — `system/{path}` */
export function systemAssetUrl(...path: string[]): string {
  return `${ASSET_BASE_URL}/${join('system', ...path)}`
}

/** 사용자 초대장 업로드 — `users/{userId}/invitations/{invitationId}/{file}` */
export function userInvitationUrl(userId: string, invitationId: string, file: string): string {
  return `${ASSET_BASE_URL}/${join('users', userId, 'invitations', invitationId, file)}`
}

/** 사용자 단위 업로드 (초대장 컨텍스트 없을 때) — `users/{userId}/uploads/{file}` */
export function userUploadUrl(userId: string, file: string): string {
  return `${ASSET_BASE_URL}/${join('users', userId, 'uploads', file)}`
}

/** 임의 키에서 절대 URL 만들기 (마이그레이션·내부 도구용) */
export function objectStoreUrl(key: string): string {
  return `${ASSET_BASE_URL}/${key.replace(/^\/+/, '')}`
}
