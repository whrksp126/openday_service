import { NextRequest } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

// Next.js 15 standalone 빌드는 빌드 시점의 publicFiles 매니페스트만 정적으로 서빙한다.
// 런타임에 추가된 public/uploads/* 는 빌드 시 비어있던 디렉토리라 매니페스트 밖이고
// 그래서 /uploads/* 로 직접 접근하면 404. 이 라우트가 fs 로 직접 서빙해 우회한다.

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params
  if (!parts || parts.length === 0) {
    return new Response('Not Found', { status: 404 })
  }

  const root = path.join(process.cwd(), 'public', 'uploads')
  const target = path.join(root, ...parts)

  // path traversal 방지
  const normalized = path.normalize(target)
  if (!normalized.startsWith(root + path.sep) && normalized !== root) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const s = await stat(normalized)
    if (!s.isFile()) return new Response('Not Found', { status: 404 })
    const buf = await readFile(normalized)
    const ext = path.extname(normalized).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return new Response(ab, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(s.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}
