import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
const AUDIO_EXTS = ['mp3', 'm4a', 'wav', 'ogg', 'aac']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/

async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
  return uploadDir
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')

  if (kind === 'base64') {
    let dataUrl: string
    try {
      const body = (await req.json()) as { dataUrl?: string }
      dataUrl = body?.dataUrl ?? ''
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const m = DATA_URL_RE.exec(dataUrl)
    if (!m) {
      return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 })
    }
    const ext = m[1] === 'jpg' ? 'jpeg' : m[1]
    const buf = Buffer.from(m[2], 'base64')
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      const maxMb = Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)
      return NextResponse.json({ error: `이미지가 너무 큽니다. 최대 ${maxMb}MB까지 업로드할 수 있습니다.` }, { status: 413 })
    }
    const uploadDir = await ensureUploadDir()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await writeFile(path.join(uploadDir, filename), buf)
    return NextResponse.json({ url: `/uploads/${filename}` })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isImage = IMAGE_EXTS.includes(ext)
  const isAudio = AUDIO_EXTS.includes(ext)
  if (!isImage && !isAudio) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const limit = isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES
  if (file.size > limit) {
    const maxMb = Math.floor(limit / 1024 / 1024)
    return NextResponse.json({ error: `파일이 너무 큽니다. 최대 ${maxMb}MB까지 업로드할 수 있습니다.` }, { status: 413 })
  }

  const uploadDir = await ensureUploadDir()

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/${filename}` })
}
