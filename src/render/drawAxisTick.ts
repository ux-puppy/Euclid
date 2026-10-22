import type { AxisScene } from '../layout/bar/types'

type AxisTick = AxisScene['ticks'][number]

export function drawAxisTickLabel(
  ctx: CanvasRenderingContext2D,
  t: AxisTick,
  defaultFont: string,
  fillStyle: string,
) {
  const fontSize = t.fontSize ?? 11
  const fontFamily =
    t.fontFamily ??
    ((defaultFont.includes(' ') ? defaultFont.split(' ').slice(1).join(' ') : defaultFont) ||
      'DM Sans')
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = fillStyle

  if (t.labelRotation != null) {
    ctx.save()
    ctx.translate(t.lx, t.ly)
    ctx.rotate(t.labelRotation)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(t.label, 0, 0)
    ctx.restore()
    return
  }

  if (t.labelLines && t.labelLines.length > 0) {
    const lh = t.lineHeight ?? fontSize * 1.25
    const totalH = t.labelLines.length * lh
    let y = t.ly - totalH / 2 + lh / 2
    ctx.textAlign = t.textAlign ?? 'right'
    ctx.textBaseline = 'middle'
    for (const line of t.labelLines) {
      ctx.fillText(line, t.lx, y)
      y += lh
    }
    return
  }

  ctx.textAlign = t.textAlign ?? 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText(t.label, t.lx, t.ly)
}
