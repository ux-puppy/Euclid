import type { ChartLabels } from '../chart-spec/types'

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

/** Fade label alpha at the right edge (layer must contain text only). */
function applyTextFadeMask(
  ctx: CanvasRenderingContext2D,
  boxW: number,
  boxH: number,
) {
  const fadeW = Math.min(FADE_WIDTH_PX, boxW * 0.5)
  if (fadeW <= 1) return

  const fadeStart = boxW - fadeW
  const g = ctx.createLinearGradient(fadeStart, 0, boxW, 0)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, boxW, boxH)
  ctx.globalCompositeOperation = 'source-over'
}

function drawTextLayerWithFade(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  drawOnLayer: (layerCtx: CanvasRenderingContext2D, logicalW: number, logicalH: number) => void,
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
  applyTextFadeMask(layer, boxW, boxH)

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
