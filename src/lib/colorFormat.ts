import { converter, formatHex } from 'culori'
import type iro from '@jaames/iro'
import { readColorAlpha } from '../heatmap-colors/colorAlpha'
import { hexWithAlpha } from '../visualization-colors/oklch'

const toRgb = converter('rgb')

export function formatIroColor(color: iro.Color): string {
  if (color.alpha < 1) return color.hex8String
  return color.hexString
}

export function colorToHexField(color: iro.Color): string {
  return color.alpha < 1 ? color.hex8String.toUpperCase() : color.hexString.toUpperCase()
}

/** Parse spec token strings for iro (accepts hex, rgb, rgba, hsl). */
export function colorForIro(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '#888888'
  return trimmed
}

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

export function parseHexInput(input: string): string | null {
  const t = input.trim()
  if (!HEX_RE.test(t)) return null
  return t
}

/** Normalize chart token strings (hex, rgb, rgba, hsl) to uppercase `#RRGGBB` or `#RRGGBBAA`. */
export function colorTokenToDisplayHex(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '#888888'

  const rgb = toRgb(trimmed)
  if (!rgb || rgb.r == null || rgb.g == null || rgb.b == null) {
    return trimmed.startsWith('#') ? trimmed.toUpperCase() : trimmed
  }

  const opaque =
    formatHex({ mode: 'rgb', r: rgb.r, g: rgb.g, b: rgb.b })?.toUpperCase() ?? '#888888'
  const alpha = readColorAlpha(trimmed)
  if (alpha < 0.999) {
    return hexWithAlpha(opaque, alpha).toUpperCase()
  }
  return opaque
}
