import type iro from '@jaames/iro'

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
