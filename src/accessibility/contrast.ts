import { converter, formatHex } from 'culori'

const toRgb = converter('rgb')

function channelLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(color: string): number | null {
  const rgb = toRgb(color)
  if (!rgb || rgb.r == null || rgb.g == null || rgb.b == null) return null
  const r = channelLinear(rgb.r)
  const g = channelLinear(rgb.g)
  const b = channelLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio (1–21). */
export function contrastRatio(foreground: string, background: string): number | null {
  const lf = relativeLuminance(foreground)
  const lb = relativeLuminance(background)
  if (lf == null || lb == null) return null
  const lighter = Math.max(lf, lb)
  const darker = Math.min(lf, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Alpha-composite `foreground` over opaque `background`; returns opaque #rrggbb. */
export function compositeOver(foreground: string, background: string): string {
  const fg = toRgb(foreground)
  const bg = toRgb(background)
  if (!fg || !bg || fg.r == null || bg.r == null) return foreground
  const a = fg.alpha ?? 1
  if (a >= 0.999) {
    return formatHex({ mode: 'rgb', r: fg.r, g: fg.g ?? 0, b: fg.b ?? 0 }) ?? foreground
  }
  const r = (fg.r ?? 0) * a + (bg.r ?? 0) * (1 - a)
  const g = (fg.g ?? 0) * a + (bg.g ?? 0) * (1 - a)
  const b = (fg.b ?? 0) * a + (bg.b ?? 0) * (1 - a)
  return formatHex({ mode: 'rgb', r, g, b }) ?? foreground
}

/** Viz fill vs chart background (composites translucent fills on the chart bg). */
export function contrastRatioFillOnBackground(fill: string, chartBackground: string): number | null {
  const visibleFill = compositeOver(fill, chartBackground)
  return contrastRatio(visibleFill, chartBackground)
}

/** On-bar label text (`textSecondary`) over an opaque series fill. */
export function contrastRatioVizTextOnFill(textSecondary: string, fill: string): number | null {
  return contrastRatio(textSecondary, fill)
}

export function passesContrastThreshold(ratio: number | null, minRatio: number): boolean {
  return ratio != null && ratio >= minRatio
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}

/** #000 or #fff for short labels on arbitrary fills. */
export function labelOnFill(fill: string): string {
  const l = relativeLuminance(fill)
  if (l == null) return '#000'
  return l > 0.45 ? '#000' : '#fff'
}

/** Label color from fill composited over an opaque background (sRGB alpha-over). */
export function labelOnFillOverBackground(fill: string, background: string): string {
  const fg = toRgb(fill)
  const bg = toRgb(background)
  if (!fg || !bg || fg.r == null || bg.r == null) return labelOnFill(fill)
  const a = fg.alpha ?? 1
  if (a >= 0.999) return labelOnFill(fill)
  const r = (fg.r ?? 0) * a + (bg.r ?? 0) * (1 - a)
  const g = (fg.g ?? 0) * a + (bg.g ?? 0) * (1 - a)
  const b = (fg.b ?? 0) * a + (bg.b ?? 0) * (1 - a)
  const flat = formatHex({ mode: 'rgb', r, g, b })
  return labelOnFill(flat ?? fill)
}
