/**
 * 1회성(멱등) — objectStore의 `openday` 버킷에 anonymous GetObject 허용 정책을 적용한다.
 *
 * MinIO/S3 호환 스토리지는 PutObject 시 ACL=public-read 만으로는 anonymous 접근이
 * 자동 허용되지 않는다. 버킷 정책으로 명시적으로 GetObject 를 Allow 해야 정적 자산이
 * 브라우저에서 직접 로드된다.
 *
 * 실행:
 *   docker exec openday_nextjs_local npx tsx scripts/set-objectstore-bucket-public.ts
 */

import { PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3'

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_REGION = process.env.S3_REGION || 'us-east-1'
const S3_BUCKET = process.env.S3_BUCKET
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
const S3_FORCE_PATH_STYLE = (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true'

if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  console.error('Missing S3 env vars')
  process.exit(1)
}

const client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  forcePathStyle: S3_FORCE_PATH_STYLE,
})

const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${S3_BUCKET}/*`],
    },
  ],
}

async function main() {
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: S3_BUCKET,
      Policy: JSON.stringify(policy),
    })
  )
  console.log(`Public-read policy applied to bucket "${S3_BUCKET}"`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
