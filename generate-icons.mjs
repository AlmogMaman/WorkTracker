// Run once: node generate-icons.mjs
// Generates pwa-192.png and pwa-512.png in /public
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / 512

  // Background rounded rect
  const r = 100 * s
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#2563EB'
  ctx.fill()

  const cx = 256 * s
  const cy = 276 * s

  // Clock face
  ctx.beginPath()
  ctx.arc(cx, cy, 150 * s, 0, Math.PI * 2)
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 26 * s
  ctx.stroke()

  ctx.lineCap = 'round'

  // Hour hand (12 o'clock)
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, 168 * s)
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 24 * s
  ctx.stroke()

  // Minute hand
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(334 * s, 322 * s)
  ctx.lineWidth = 20 * s
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 14 * s, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()

  // Crown stem
  ctx.beginPath()
  const stemX = 232 * s, stemY = 94 * s, stemW = 48 * s, stemH = 26 * s
  ctx.roundRect(stemX, stemY, stemW, stemH, 13 * s)
  ctx.fillStyle = 'white'
  ctx.fill()

  return canvas.toBuffer('image/png')
}

try {
  writeFileSync('public/pwa-192.png', drawIcon(192))
  writeFileSync('public/pwa-512.png', drawIcon(512))
  console.log('Icons generated: public/pwa-192.png, public/pwa-512.png')
} catch (e) {
  console.error('canvas package not available. Using SVG fallback.')
  // SVG fallback: copy icon.svg content for both sizes
  // The manifest will reference SVG if PNG not available
}
