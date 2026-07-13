/* eslint-disable */
const fs = require('node:fs')
const path = require('node:path')

// 16x16 32-bpp solid-color ICO with primary #5B4FCF
const W = 16
const H = 16
const HEADER = 6 + 16 + 40
const PIXEL = W * H * 4
const MASK = (W * H) / 8
const buf = Buffer.alloc(HEADER + PIXEL + MASK)

// ICONDIR
buf.writeUInt16LE(0, 0)
buf.writeUInt16LE(1, 2)
buf.writeUInt16LE(1, 4)

// ICONDIRENTRY
buf.writeUInt8(W, 6)
buf.writeUInt8(H, 7)
buf.writeUInt8(0, 8)
buf.writeUInt8(0, 9)
buf.writeUInt16LE(1, 10)
buf.writeUInt16LE(32, 12)
buf.writeUInt32LE(40 + PIXEL + MASK, 14)
buf.writeUInt32LE(22, 18)

// BITMAPINFOHEADER
let p = 22
buf.writeUInt32LE(40, p); p += 4
buf.writeInt32LE(W, p); p += 4
buf.writeInt32LE(H * 2, p); p += 4
buf.writeUInt16LE(1, p); p += 2
buf.writeUInt16LE(32, p); p += 2
buf.writeUInt32LE(0, p); p += 4
buf.writeUInt32LE(PIXEL + MASK, p); p += 4
buf.writeInt32LE(0, p); p += 4
buf.writeInt32LE(0, p); p += 4
buf.writeUInt32LE(0, p); p += 4
buf.writeUInt32LE(0, p); p += 4

// Pixel data: BGRA, bottom-up
const R = 0x5b, G = 0x4f, B = 0xcf, A = 0xff
for (let y = H - 1; y >= 0; y--) {
  for (let x = 0; x < W; x++) {
    buf.writeUInt8(B, p); p++
    buf.writeUInt8(G, p); p++
    buf.writeUInt8(R, p); p++
    buf.writeUInt8(A, p); p++
  }
}

// AND mask (all opaque)
for (let i = 0; i < MASK; i++) {
  buf.writeUInt8(0, p); p++
}

const outDir = path.join(__dirname, '..', 'src', 'app')
fs.writeFileSync(path.join(outDir, 'favicon.ico'), buf)
console.log('Wrote favicon.ico:', buf.length, 'bytes')
