import { chromium } from 'playwright'
import fs from 'fs'

const IDS = process.argv.slice(2)
const BASE = 'https://openday.ghmate.com'
const OUT = new URL('./shots/', import.meta.url).pathname

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
})

for (const id of IDS) {
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)))
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(0, 160)}`) })

  console.log('== ' + id)
  await page.goto(`${BASE}/templates/${id}`, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => console.log('nav:', e.message))
  await page.waitForTimeout(2500)

  // scroll through to trigger reveal animations / lazy images
  let h = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < h; y += 600) {
    await page.evaluate((y) => window.scrollTo(0, y), y)
    await page.waitForTimeout(320)
    h = await page.evaluate(() => document.body.scrollHeight)
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1200)

  const total = await page.evaluate(() => document.body.scrollHeight)
  const SEG = 860 // slight overlap against 932 viewport
  const n = Math.ceil((total - 932) / SEG) + 1
  console.log(`   height=${total} segments=${n}`)
  for (let i = 0; i < n; i++) {
    const y = Math.min(i * SEG, total - 932)
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, y))
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}${id}__${String(i).padStart(2, '0')}.png` })
  }

  // dump rendered text for reference
  const text = await page.evaluate(() => document.body.innerText)
  fs.writeFileSync(`${OUT}${id}.txt`, text)
  fs.writeFileSync(`${OUT}${id}.errors.txt`, [...new Set(errors)].join('\n'))
  await page.close()
}

await browser.close()
console.log('done')
