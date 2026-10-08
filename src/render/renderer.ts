import { resolveSurfaceForTheme } from '../chart-spec/surfaceColors'
import type { ChartSpec } from '../chart-spec/types'
import { isHeatmapChartSpec } from '../chart-spec/types'
import type { ChartTheme } from '../visualization-colors/types'
import type { SceneGraph } from '../layout/bar/types'
import { drawAxisTickLabel } from './drawAxisTick'
import { drawBarLabelInBar, drawCenteredLabelInBox } from './labelFade'

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

  const skipAxisTickMarks = isHeatmapChartSpec(spec)
  for (const ax of scene.axes) {
    const defaultFont = `${ax.orientation === 'vertical' ? spec.axes.y.fontSize : spec.axes.x.fontSize}px ${tickFont}`
    for (const t of ax.ticks) {
      if (!skipAxisTickMarks) {
        ctx.beginPath()
        ctx.moveTo(t.x1, t.y1)
        ctx.lineTo(t.x2, t.y2)
        ctx.strokeStyle = surface.axis
        ctx.stroke()
      }
      drawAxisTickLabel(ctx, t, defaultFont, surface.axis)
    }
  }

  for (const cell of scene.heatmapCells) {
    if (cell.progress <= 0) continue
    ctx.globalAlpha = geometry.opacity * cell.progress
    ctx.fillStyle = cell.fill
    roundRect(ctx, cell.x, cell.y, cell.width, cell.height, geometry.cornerRadius)
    ctx.fill()
    const strokeWidth =
      geometry.borderWidth > 0
        ? geometry.borderWidth
        : cell.state !== 'default'
          ? 1
          : 0
    if (strokeWidth > 0) {
      ctx.strokeStyle = cell.stroke
      ctx.lineWidth = strokeWidth
      ctx.stroke()
    }
    if (labels.show && cell.label && cell.progress >= 0.85) {
      const pad = 4
      drawCenteredLabelInBox(ctx, {
        text: cell.label,
        boxX: cell.x,
        boxY: cell.y,
        boxW: cell.width,
        boxH: cell.height,
        font: `${typography.baseFontSize}px ${valueFont}`,
        textColor: cell.labelColor,
        pad,
        labelOverflow: labels.labelOverflow,
        insetY: labels.insetY,
      })
    }
    ctx.globalAlpha = 1
  }

  const colorLegend = scene.heatmapColorLegend
  if (colorLegend) {
    const { x, y, width, height, samples, minLabel, maxLabel, midLabel } = colorLegend
    const stepW = width / Math.max(1, samples.length)
    for (let i = 0; i < samples.length; i++) {
      ctx.fillStyle = samples[i]!
      ctx.fillRect(x + i * stepW, y, stepW + 0.5, height)
    }
    ctx.fillStyle = surface.textSecondary
    ctx.font = `${spec.legend.fontSize}px ${typography.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(minLabel, x, y + height + 4)
    ctx.textAlign = 'right'
    ctx.fillText(maxLabel, x + width, y + height + 4)
    if (midLabel) {
      ctx.textAlign = 'center'
      ctx.fillText(midLabel, x + width / 2, y + height + 4)
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
      const nameFont = `${typography.baseFontSize}px ${bodyFont}`
      const valueFontSpec = `${typography.baseFontSize}px ${valueFont}`
      drawBarLabelInBar(ctx, {
        label: row.label,
        labelValueText: row.labelValueText,
        labelNameText: row.labelNameText,
        labelX: row.labelX,
        barX: row.barX,
        barY: row.y,
        barWidth: row.barWidth,
        barHeight: row.height,
        labels,
        nameFont,
        valueFontSpec,
        textColor: row.labelColor ?? surface.textSecondary,
      })
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
