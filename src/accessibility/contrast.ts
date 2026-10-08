import { converter } from 'culori'

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
