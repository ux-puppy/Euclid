import { resolveSurfaceForTheme } from '../chart-spec/surfaceColors'
import type { ChartSpec } from '../chart-spec/types'
import type { ChartTheme } from '../visualization-colors/types'
import type { SceneGraph } from '../layout/bar/types'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  if (radius <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneGraph,
  spec: ChartSpec,
  theme: ChartTheme,
  canvasHeight = scene.height,
) {
  const { geometry, typography, labels } = spec
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const gridStroke = spec.grid.color || surface.grid
  const valueFont = labels.valueFontFamily || 'DM Mono'
  const bodyFont = typography.fontFamily
  const tickFont =
    labels.valueFormat.style === 'percent' ? valueFont : bodyFont
  const bgH = Math.max(scene.height, canvasHeight)

  ctx.clearRect(0, 0, scene.width, bgH)
  ctx.fillStyle = scene.background
  const bgRadius = Math.max(0, spec.containerCornerRadius ?? 0)
  if (bgRadius > 0) {
    roundRect(ctx, 0, 0, scene.width, bgH, bgRadius)
    ctx.fill()
  } else {
    ctx.fillRect(0, 0, scene.width, bgH)
  }

  for (const g of scene.gridLines) {
    ctx.strokeStyle = gridStroke
    ctx.globalAlpha = spec.grid.opacity
    ctx.lineWidth = spec.grid.strokeWidth
    ctx.setLineDash(spec.grid.dash)
    ctx.beginPath()
    ctx.moveTo(g.x1, g.y1)
    ctx.lineTo(g.x2, g.y2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  for (const ax of scene.axes) {
    ctx.fillStyle = surface.axis
    ctx.font = `${ax.ticks[0] ? spec.axes.y.fontSize : 11}px ${tickFont}`
    ctx.textBaseline = 'middle'
    for (const t of ax.ticks) {
      ctx.beginPath()
      ctx.moveTo(t.x1, t.y1)
      ctx.lineTo(t.x2, t.y2)
      ctx.strokeStyle = surface.axis
      ctx.stroke()
      ctx.textAlign = t.textAlign ?? 'right'
      ctx.fillText(t.label, t.lx, t.ly)
    }
  }

  for (const gt of scene.groupTitles) {
    ctx.fillStyle = surface.text
    ctx.font = `500 ${gt.fontSize}px ${typography.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(gt.text, gt.x, gt.y)
  }

  scene.barRows.forEach((row) => {
    ctx.globalAlpha = geometry.opacity
    const clipH = row.revealClipHeight
    const clipTop = row.revealClipTop ?? row.slotTop ?? row.y
    const useSectionReveal = clipH != null && row.revealClipTop != null

    if (useSectionReveal) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(row.x, clipTop, row.width, clipH)
      ctx.clip()
    }

    ctx.fillStyle = row.fill
    roundRect(ctx, row.barX, row.y, row.barWidth, row.height, geometry.cornerRadius)
    ctx.fill()
    const strokeWidth =
      geometry.borderWidth > 0
        ? geometry.borderWidth
        : row.state !== 'default'
          ? 1
          : 0
    if (strokeWidth > 0) {
      ctx.strokeStyle = row.stroke
      ctx.lineWidth = strokeWidth
      ctx.stroke()
    }

    if (labels.show && row.label) {
      ctx.fillStyle = surface.textSecondary
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const ty = row.y + row.height / 2
      const nameFont = `${typography.baseFontSize}px ${bodyFont}`
      const valueFontSpec = `${typography.baseFontSize}px ${valueFont}`
      const drawLabelText = () => {
        if (row.labelValueText != null && row.labelNameText != null) {
          const colW = labels.valueColumnWidth
          ctx.textAlign = 'left'
          ctx.font = valueFontSpec
          ctx.fillText(row.labelValueText, row.labelX, ty)
          ctx.font = nameFont
          ctx.fillText(
            row.labelNameText,
            row.labelX + colW + labels.valueLabelGap,
            ty,
          )
        } else {
          ctx.font =
            labels.valueFormat.style === 'percent' ? valueFontSpec : nameFont
          ctx.fillText(row.label, row.labelX, ty)
        }
      }
      if (labels.labelOverflow === 'clip') {
        ctx.save()
        ctx.beginPath()
        ctx.rect(row.barX, row.y, row.barWidth, row.height)
        ctx.clip()
        drawLabelText()
        ctx.restore()
      } else {
        drawLabelText()
      }
    }

    if (useSectionReveal) ctx.restore()

    ctx.globalAlpha = 1
  })

  for (const li of scene.legendItems) {
    ctx.fillStyle = li.color
    ctx.fillRect(li.x, li.y, 10, 10)
    ctx.fillStyle = surface.textSecondary
    ctx.font = `${spec.legend.fontSize}px ${typography.fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillText(li.label, li.x + 14, li.y + 9)
  }
}

export function hitTest(
  scene: SceneGraph,
  x: number,
  y: number,
): import('../layout/bar/types').HitRegion | null {
  for (let i = scene.hits.length - 1; i >= 0; i--) {
    const h = scene.hits[i]!
    if (x >= h.x && x <= h.x + h.width && y >= h.y && y <= h.y + h.height) {
      return h
    }
  }
  return null
}
