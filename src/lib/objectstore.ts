import { S3Client, PutObjectCommand, type PutObjectCommandOutput, type ObjectCannedACL } from '@aws-sdk/client-s3'

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_REGION = process.env.S3_REGION || 'us-east-1'
const S3_BUCKET = process.env.S3_BUCKET
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
const S3_FORCE_PATH_STYLE = (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true'

if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  // 빌드 타임에는 env가 없을 수도 있으므로 throw 하지 않고 런타임에 체크한다.
  // 실제 업로드 호출 시 assertS3Configured()에서 명시적으로 확인.
}

let _client: S3Client | null = null

function getClient(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: S3_FORCE_PATH_STYLE,
  })
  return _client
}

// 홈서버는 정전/부팅 직후 시계가 잠깐 틀어질 수 있다. 그때 AWS SDK가 잘못된
// clock offset 을 캐시하면, 시계가 복구된 뒤에도 이 싱글턴 클라이언트가 계속
// RequestTimeTooSkewed 로 실패한다(프로세스 재시작 전까지). skew 에러를 만나면
// 클라이언트를 재생성(offset 리셋)한 뒤 재시도해 재시작 없이 자가회복한다.
// 참고: GHMATE_SERVER_GUIDE.md "서버 시각 동기", codingpt_back/services/s3Service.js
function isClockSkewError(err: unknown): boolean {
  const e = err as { name?: string; Code?: string; code?: string } | null
  const name = e?.name || e?.Code || e?.code || ''
  return name === 'RequestTimeTooSkewed' || name === 'RequestExpired'
}

async function sendPutWithSkewRetry(cmd: PutObjectCommand, maxRetries = 2): Promise<PutObjectCommandOutput> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getClient().send(cmd)
    } catch (err) {
      if (attempt < maxRetries && isClockSkewError(err)) {
        _client = null // 캐시된 clock offset 리셋 → 다음 getClient() 가 새 클라이언트 생성
        continue
      }
      throw err
    }
  }
}

function assertS3Configured() {
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error('S3 environment variables are not configured (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)')
  }
}

export interface UploadObjectInput {
  key: string
  body: Buffer | Uint8Array
  contentType?: string
  acl?: ObjectCannedACL
  cacheControl?: string
}

export async function uploadObject({ key, body, contentType, acl, cacheControl }: UploadObjectInput): Promise<string> {
  assertS3Configured()
  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: acl ?? 'public-read',
    CacheControl: cacheControl ?? 'public, max-age=31536000, immutable',
  })
  await sendPutWithSkewRetry(cmd)
  return getPublicUrl(key)
}

export function getPublicUrl(key: string): string {
  assertS3Configured()
  const base = (S3_ENDPOINT as string).replace(/\/$/, '')
  const cleanKey = key.replace(/^\//, '')
  return `${base}/${S3_BUCKET}/${cleanKey}`
}

export const objectStore = {
  bucket: S3_BUCKET,
  endpoint: S3_ENDPOINT,
  client: getClient,
}
