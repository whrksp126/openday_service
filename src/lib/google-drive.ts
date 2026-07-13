import { createHmac, createHash, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

// ── Types ────────────────────────────────────────────────────────────────────

interface TokenRefreshResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope?: string
}

interface DriveCreateFolderResponse {
  id: string
  webViewLink?: string
}

interface DriveFileMetaResponse {
  id?: string
  thumbnailLink?: string
  webContentLink?: string
  name?: string
  mimeType?: string
  [key: string]: unknown
}

interface OAuthStatePayload {
  invitationId: string
  moduleId: string
  nonce: string
  ts: number
  returnTo?: string
}

// ── Token Refresh ─────────────────────────────────────────────────────────────

/**
 * InvitationDriveLink(모듈별)에서 유효한 access_token을 반환.
 * accessExpiresAt이 5분 이내면 refresh_token으로 갱신 후 저장.
 */
export async function getValidDriveAccessToken(invitationId: string, moduleId: string): Promise<string> {
  const link = await prisma.invitationDriveLink.findUnique({
    where: { invitationId_moduleId: { invitationId, moduleId } },
  })

  if (!link) {
    throw new Error(`No DriveLink found for invitation ${invitationId} module ${moduleId}`)
  }

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  const needsRefresh =
    !link.accessToken ||
    !link.accessExpiresAt ||
    link.accessExpiresAt <= fiveMinutesFromNow

  if (!needsRefresh && link.accessToken) {
    return link.accessToken
  }

  // Refresh
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: link.refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Token refresh failed: ${res.status} ${errText}`)
  }

  const data: TokenRefreshResponse = await res.json()

  // 만료 시간: now + expires_in - 60초 버퍼
  const accessExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000)

  await prisma.invitationDriveLink.update({
    where: { invitationId_moduleId: { invitationId, moduleId } },
    data: {
      accessToken: data.access_token,
      accessExpiresAt,
    },
  })

  return data.access_token
}

// ── Drive Folder ──────────────────────────────────────────────────────────────

/**
 * Google Drive에 폴더를 생성하고 { id, webViewLink } 반환.
 */
export async function createDriveFolder(
  accessToken: string,
  name: string
): Promise<{ id: string; webViewLink?: string }> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`createDriveFolder failed: ${res.status} ${errText}`)
  }

  const data: DriveCreateFolderResponse = await res.json()
  return { id: data.id, webViewLink: data.webViewLink }
}

// ── Resumable Upload ──────────────────────────────────────────────────────────

/**
 * Drive resumable upload session 시작.
 * 응답 헤더 Location의 단일 사용 uploadUrl 반환.
 */
export async function startResumableUpload(params: {
  accessToken: string
  folderId: string
  name: string
  mimeType: string
  sizeBytes: number
}): Promise<{ uploadUrl: string }> {
  const { accessToken, folderId, name, mimeType, sizeBytes } = params

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(sizeBytes),
      },
      body: JSON.stringify({
        name,
        parents: [folderId],
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`startResumableUpload failed: ${res.status} ${errText}`)
  }

  const uploadUrl = res.headers.get('Location')
  if (!uploadUrl) {
    throw new Error('startResumableUpload: no Location header in response')
  }

  return { uploadUrl }
}

// ── File Meta ─────────────────────────────────────────────────────────────────

/**
 * Drive 파일 메타 조회.
 * fields 기본값: 'thumbnailLink,webContentLink,id,name'
 */
export async function getDriveFile(
  accessToken: string,
  fileId: string,
  fields = 'thumbnailLink,webContentLink,id,name'
): Promise<DriveFileMetaResponse> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`getDriveFile failed: ${res.status} ${errText}`)
  }

  return res.json()
}

// ── Make File Public ──────────────────────────────────────────────────────────

/**
 * Drive 파일에 공개 권한 부여 (role=reader, type=anyone).
 */
export async function makeFilePublic(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`makeFilePublic failed: ${res.status} ${errText}`)
  }
}

// ── Delete File ───────────────────────────────────────────────────────────────

/**
 * Drive 파일 삭제.
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  // 204 = success, 404 = already deleted (treat as OK)
  if (!res.ok && res.status !== 404) {
    const errText = await res.text()
    throw new Error(`deleteDriveFile failed: ${res.status} ${errText}`)
  }
}

// ── Multipart Upload (Fallback) ───────────────────────────────────────────────

/**
 * Drive multipart upload (서버 프록시 fallback).
 */
export async function uploadFileMultipart(params: {
  accessToken: string
  folderId: string
  name: string
  mimeType: string
  body: Buffer | Uint8Array
}): Promise<{ id: string }> {
  const { accessToken, folderId, name, mimeType, body } = params

  const boundary = `---boundary_${Date.now().toString(36)}`
  const metadata = JSON.stringify({ name, parents: [folderId] })

  const metaPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n`

  const dataPart =
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`

  const closePart = `\r\n--${boundary}--`

  const metaBytes = Buffer.from(metaPart, 'utf-8')
  const dataHeaderBytes = Buffer.from(dataPart, 'utf-8')
  const closeBytes = Buffer.from(closePart, 'utf-8')
  const fileBytes = Buffer.isBuffer(body) ? body : Buffer.from(body)

  const multipartBody = Buffer.concat([metaBytes, dataHeaderBytes, fileBytes, closeBytes])

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBody.length),
      },
      body: multipartBody,
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`uploadFileMultipart failed: ${res.status} ${errText}`)
  }

  const data = await res.json()
  return { id: data.id as string }
}

// ── OAuth State HMAC ──────────────────────────────────────────────────────────

function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET
  if (!secret) throw new Error('OAUTH_STATE_SECRET env var is not set')
  return secret
}

function toBase64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64')
}

/**
 * OAuth state payload를 HMAC-SHA256으로 서명.
 * 형식: <base64url(payload)>.<base64url(sig)>
 */
export function signOAuthState(payload: OAuthStatePayload): string {
  const secret = getStateSecret()
  const payloadJson = JSON.stringify(payload)
  const payloadEncoded = toBase64url(Buffer.from(payloadJson, 'utf-8'))
  const sig = createHmac('sha256', secret).update(payloadEncoded).digest()
  const sigEncoded = toBase64url(sig)
  return `${payloadEncoded}.${sigEncoded}`
}

/**
 * OAuth state 검증. ts 10분 초과 또는 HMAC 불일치 시 null 반환.
 */
export function verifyOAuthState(state: string): OAuthStatePayload | null {
  try {
    const secret = getStateSecret()
    const dotIndex = state.lastIndexOf('.')
    if (dotIndex === -1) return null

    const payloadEncoded = state.slice(0, dotIndex)
    const sigEncoded = state.slice(dotIndex + 1)

    // Verify HMAC
    const expectedSig = createHmac('sha256', secret).update(payloadEncoded).digest()
    const actualSig = fromBase64url(sigEncoded)

    if (expectedSig.length !== actualSig.length) return null

    const isValid = timingSafeEqual(expectedSig, actualSig)
    if (!isValid) return null

    // Decode payload
    const payloadJson = fromBase64url(payloadEncoded).toString('utf-8')
    const payload: OAuthStatePayload = JSON.parse(payloadJson)

    // Check expiry (10 minutes)
    const tenMinutesMs = 10 * 60 * 1000
    if (Date.now() - payload.ts > tenMinutesMs) return null

    return payload
  } catch {
    return null
  }
}

// ── SHA-256 hash utility ──────────────────────────────────────────────────────

/**
 * 문자열/버퍼를 SHA-256 hex digest로 변환.
 */
export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}
