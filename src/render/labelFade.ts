import type { ChartLabels } from '../chart-spec/types'
import type { AxisScene } from '../layout/bar/types'

const LABEL_RIGHT_INSET = 4
const FADE_WIDTH_PX = 22

function measureBarLabelWidth(
  ctx: CanvasRenderingContext2D,
  label: string,
  labelValueText: string | undefined,
  labelNameText: string | undefined,
  labels: ChartLabels,
  nameFont: string,
  valueFontSpec: string,
): number {
  if (labelValueText != null && labelNameText != null) {
    ctx.font = valueFontSpec
    const valueW = ctx.measureText(labelValueText).width
    ctx.font = nameFont
    const nameW = ctx.measureText(labelNameText).width
    return valueW + labels.valueColumnWidth + labels.valueLabelGap + nameW
  }
  ctx.font = labels.valueFormat.style === 'percent' ? valueFontSpec : nameFont
  return ctx.measureText(label).width
}

function drawBarLabelText(
  ctx: CanvasRenderingContext2D,
  label: string,
  labelValueText: string | undefined,
  labelNameText: string | undefined,
  labelX: number,
  ty: number,
  labels: ChartLabels,
  nameFont: string,
  valueFontSpec: string,
  textColor: string,
) {
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  if (labelValueText != null && labelNameText != null) {
    ctx.font = valueFontSpec
    ctx.fillText(labelValueText, labelX, ty)
    ctx.font = nameFont
    ctx.fillText(
      labelNameText,
      labelX + labels.valueColumnWidth + labels.valueLabelGap,
      ty,
    )
    return
  }
  ctx.font = labels.valueFormat.style === 'percent' ? valueFontSpec : nameFont
  ctx.fillText(label, labelX, ty)
}

/** Match main chart canvas scale (devicePixelRatio × preview zoom). */
function canvasOutputScale(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform()
  const sx = Math.hypot(m.a, m.b)
  const sy = Math.hypot(m.c, m.d)
  return Math.max(sx, sy, 1)
}

type FadeEdge = 'left' | 'right' | 'top' | 'bottom'

/** Fade label alpha at one edge (layer must contain text only). */
function applyTextFadeMask(
  ctx: CanvasRenderingContext2D,
  boxW: number,
  boxH: number,
  edge: FadeEdge = 'right',
) {
  const vertical = edge === 'top' || edge === 'bottom'
  const span = vertical ? boxH : boxW
  const fadeW = Math.min(FADE_WIDTH_PX, span * 0.5)
  if (fadeW <= 1) return

  let g: CanvasGradient
  if (edge === 'right') {
    g = ctx.createLinearGradient(boxW - fadeW, 0, boxW, 0)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
  } else if (edge === 'left') {
    g = ctx.createLinearGradient(0, 0, fadeW, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(255,255,255,1)')
  } else if (edge === 'top') {
    g = ctx.createLinearGradient(0, 0, 0, fadeW)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(255,255,255,1)')
  } else {
    g = ctx.createLinearGradient(0, boxH - fadeW, 0, boxH)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
  }
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, boxW, boxH)
  ctx.globalCompositeOperation = 'source-over'
}

function fontSizeFromCssFont(font: string): number {
  const m = font.match(/^(\d+(?:\.\d+)?)px/)
  return m ? Number(m[1]) : 11
}

/** +90° column labels: shift right so glyphs land in x ∈ [0, fontSize] after rotation. */
function drawColumnLabelText(layer: CanvasRenderingContext2D, text: string, font: string, fillStyle: string) {
  const fontSize = fontSizeFromCssFont(font)
  layer.font = font
  layer.fillStyle = fillStyle
  layer.translate(fontSize, 0)
  layer.rotate(Math.PI / 2)
  layer.textAlign = 'left'
  layer.textBaseline = 'top'
  layer.fillText(text, 0, 0)
}

function drawRotatedTextInBandWithFade(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  text: string,
  font: string,
  fillStyle: string,
) {
  const scale = canvasOutputScale(ctx)
  const layerW = box.w
  ctx.font = font
  const textW = ctx.measureText(text).width
  const layerH = Math.max(box.h, Math.ceil(textW) + 4)

  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(layerW * scale))
  off.height = Math.max(1, Math.ceil(layerH * scale))
  const layer = off.getContext('2d')
  if (!layer) return

  layer.setTransform(scale, 0, 0, scale, 0, 0)
  drawColumnLabelText(layer, text, font, fillStyle)
  layer.setTransform(scale, 0, 0, scale, 0, 0)

  applyTextFadeMask(layer, layerW, box.h, 'bottom')

  const smooth = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    off,
    0,
    0,
    layerW * scale,
    box.h * scale,
    box.x,
    box.y,
    box.w,
    box.h,
  )
  ctx.imageSmoothingEnabled = smooth
}

function drawRightAlignedTextInBandWithFade(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  text: string,
  font: string,
  fillStyle: string,
) {
  const scale = canvasOutputScale(ctx)
  ctx.font = font
  const textW = ctx.measureText(text).width
  const layerW = Math.max(box.w, Math.ceil(textW) + 4)
  const layerH = box.h

  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(layerW * scale))
  off.height = Math.max(1, Math.ceil(layerH * scale))
  const layer = off.getContext('2d')
  if (!layer) return

  layer.setTransform(scale, 0, 0, scale, 0, 0)
  layer.font = font
  layer.fillStyle = fillStyle
  layer.textAlign = 'right'
  layer.textBaseline = 'middle'
  layer.fillText(text, layerW, layerH / 2)
  layer.setTransform(scale, 0, 0, scale, 0, 0)
  layer.translate(layerW - box.w, 0)
  applyTextFadeMask(layer, box.w, layerH, 'left')
  layer.setTransform(scale, 0, 0, scale, 0, 0)

  const srcX = (layerW - box.w) * scale
  const smooth = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    off,
    srcX,
    0,
    box.w * scale,
    layerH * scale,
    box.x,
    box.y,
    box.w,
    box.h,
  )
  ctx.imageSmoothingEnabled = smooth
}

function drawTextLayerWithFade(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  drawOnLayer: (layerCtx: CanvasRenderingContext2D, logicalW: number, logicalH: number) => void,
  fadeEdge: FadeEdge = 'right',
) {
  if (boxW <= 0 || boxH <= 0) return

  const scale = canvasOutputScale(ctx)
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(boxW * scale))
  off.height = Math.max(1, Math.ceil(boxH * scale))
  const layer = off.getContext('2d')
  if (!layer) return

  layer.setTransform(scale, 0, 0, scale, 0, 0)
  drawOnLayer(layer, boxW, boxH)
  applyTextFadeMask(layer, boxW, boxH, fadeEdge)

  const smooth = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, boxX, boxY, boxW, boxH)
  ctx.imageSmoothingEnabled = smooth
}

export function drawBarLabelInBar(
  ctx: CanvasRenderingContext2D,
  opts: {
    label: string
    labelValueText?: string
    labelNameText?: string
    labelX: number
    barX: number
    barY: number
    barWidth: number
    barHeight: number
    labels: ChartLabels
    nameFont: string
    valueFontSpec: string
    textColor: string
  },
) {
  const {
    label,
    labelValueText,
    labelNameText,
    labelX,
    barX,
    barY,
    barWidth,
    barHeight,
    labels,
    nameFont,
    valueFontSpec,
    textColor,
  } = opts

  const insetY = labels.insetY ?? 0
  const ty = barY + barHeight / 2 + insetY
  const availW = Math.max(0, barX + barWidth - labelX - LABEL_RIGHT_INSET)
  const textW = measureBarLabelWidth(
    ctx,
    label,
    labelValueText,
    labelNameText,
    labels,
    nameFont,
    valueFontSpec,
  )

  const overflowMode = labels.labelOverflow
  const spillOutside = overflowMode === 'overflow'
  const useFade =
    overflowMode === 'fade' ||
    overflowMode === 'clip' ||
    (textW > availW && !spillOutside)

  if (!useFade || textW <= availW) {
    drawBarLabelText(
      ctx,
      label,
      labelValueText,
      labelNameText,
      labelX,
      ty,
      labels,
      nameFont,
      valueFontSpec,
      textColor,
    )
    return
  }

  const localX = labelX - barX
  const localY = barHeight / 2 + insetY
  drawTextLayerWithFade(ctx, barX, barY, barWidth, barHeight, (layer) => {
    drawBarLabelText(
      layer,
      label,
      labelValueText,
      labelNameText,
      localX,
      localY,
      labels,
      nameFont,
      valueFontSpec,
      textColor,
    )
  })
}

export function drawCenteredLabelInBox(
  ctx: CanvasRenderingContext2D,
  opts: {
    text: string
    boxX: number
    boxY: number
    boxW: number
    boxH: number
    font: string
    textColor: string
    pad: number
    labelOverflow: ChartLabels['labelOverflow']
    insetY?: number
  },
) {
  const { text, boxX, boxY, boxW, boxH, font, textColor, pad, labelOverflow, insetY = 0 } =
    opts
  const innerX = boxX + pad
  const innerY = boxY + pad
  const innerW = Math.max(0, boxW - pad * 2)
  const innerH = Math.max(0, boxH - pad * 2)
  if (innerW <= 0 || innerH <= 0) return

  ctx.font = font
  const textW = ctx.measureText(text).width
  const cx = boxX + boxW / 2
  const cy = boxY + boxH / 2 + insetY
  const spillOutside = labelOverflow === 'overflow'
  const useFade =
    labelOverflow === 'fade' ||
    labelOverflow === 'clip' ||
    (textW > innerW && !spillOutside)

  if (!useFade || textW <= innerW) {
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, cx, cy)
    return
  }

  drawTextLayerWithFade(ctx, innerX, innerY, innerW, innerH, (layer, w, h) => {
    layer.font = font
    layer.fillStyle = textColor
    layer.textAlign = 'center'
    layer.textBaseline = 'middle'
    layer.fillText(text, w / 2, h / 2 + insetY)
  })
}

type AxisTick = AxisScene['ticks'][number]

function axisTickFont(t: AxisTick, defaultFont: string): string {
  const fontSize = t.fontSize ?? 11
  const fontFamily =
    t.fontFamily ??
    ((defaultFont.includes(' ') ? defaultFont.split(' ').slice(1).join(' ') : defaultFont) ||
      'DM Sans')
  return `${fontSize}px ${fontFamily}`
}

/** Heatmap axis labels in fixed layout bands; overflow fades per labelOverflow. */
export function drawHeatmapAxisTickLabel(
  ctx: CanvasRenderingContext2D,
  t: AxisTick,
  defaultFont: string,
  fillStyle: string,
  labelOverflow: ChartLabels['labelOverflow'],
) {
  const box = t.labelBox
  if (!box || box.w <= 0 || box.h <= 0) return

  const font = axisTickFont(t, defaultFont)
  ctx.font = font
  const text = t.label
  const textW = ctx.measureText(text).width
  const spillOutside = labelOverflow === 'overflow'
  const rotated = t.labelRotation != null

  const overflowLimit = rotated ? box.h : box.w
  const useSoftFade =
    labelOverflow === 'fade' && !spillOutside && textW > overflowLimit

  const drawPlain = () => {
    ctx.save()
    ctx.beginPath()
    ctx.rect(box.x, box.y, box.w, box.h)
    ctx.clip()
    ctx.fillStyle = fillStyle
    if (rotated) {
      ctx.translate(box.x, box.y)
      drawColumnLabelText(ctx, text, font, fillStyle)
    } else {
      ctx.textAlign = t.textAlign ?? 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, t.lx, t.ly)
    }
    ctx.restore()
  }

  if (!useSoftFade) {
    drawPlain()
    return
  }

  if (rotated) {
    drawRotatedTextInBandWithFade(ctx, box, text, font, fillStyle)
    return
  }

  drawRightAlignedTextInBandWithFade(ctx, box, text, font, fillStyle)
}
