import { converter } from 'culori'
import { hexWithAlpha } from '../visualization-colors/oklch'
import type { HeatmapColorConfig } from './types'

const toRgb = converter('rgb')

export function readColorAlpha(color: string): number {
  const rgb = toRgb(color)
  if (!rgb) return 1
  const a = rgb.alpha
  if (a == null || Number.isNaN(a)) return 1
  return Math.min(1, Math.max(0, a))
}

/** Attach alpha to an opaque `#rrggbb` (or normalize full-opacity tokens). */
export function attachAlpha(opaqueColor: string, alpha: number): string {
  if (alpha >= 0.999) {
    if (opaqueColor.length === 9) return `#${opaqueColor.slice(1, 7)}`
    return opaqueColor
  }
  return hexWithAlpha(opaqueColor, alpha)
}

export function lerpAlpha(a: string, b: string, t: number): number {
  return readColorAlpha(a) + (readColorAlpha(b) - readColorAlpha(a)) * t
}

/** Render-time color: opaque when stop alpha is disabled in settings. */
export function heatmapColorForOutput(
  color: string,
  config: Pick<HeatmapColorConfig, 'useStopAlpha'>,
): string {
  if (config.useStopAlpha) return color
  return attachAlpha(color, 1)
}
