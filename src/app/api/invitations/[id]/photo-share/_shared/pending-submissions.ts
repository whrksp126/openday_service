// 공유 in-memory 캐시: upload-token 발급 후 submission 등록까지 임시 보관
// Next.js가 핫리로드로 모듈을 재로드해도 globalThis에 붙여서 유지

interface PendingSubmission {
  deleteTokenHash: string
  invitationId: string
  moduleId: string
  expiresAt: number
}

const globalForPending = globalThis as unknown as {
  _pendingSubmissions: Map<string, PendingSubmission> | undefined
}

export const pendingSubmissions: Map<string, PendingSubmission> =
  globalForPending._pendingSubmissions ??
  (() => {
    const map = new Map<string, PendingSubmission>()
    globalForPending._pendingSubmissions = map
    return map
  })()

// 만료 항목 정리 (10분 주기)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of pendingSubmissions.entries()) {
      if (now > entry.expiresAt) {
        pendingSubmissions.delete(key)
      }
    }
  }, 10 * 60_000)
}
