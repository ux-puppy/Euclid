import { clampChroma, converter, formatHex, oklch } from 'culori'
import type { OklchDistanceWeights } from './types'

const DEFAULT_DISTANCE_WEIGHTS: OklchDistanceWeights = {
  lightness: 1,
  chroma: 1,
  hue: 1,
}

const toOklch = converter('oklch')
const toRgb = converter('rgb')

export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360
}

export function hueFromHex(hex: string): number | null {
  const parsed = toOklch(hex)
  if (!parsed || parsed.h == null || Number.isNaN(parsed.h)) return null
  return normalizeHue(parsed.h)
}

/** Clamp chroma to sRGB gamut and serialize as #rrggbb for canvas/CSS. */
export function oklchToHex(l: number, c: number, h: number): string {
  const clamped = clampChroma({ mode: 'oklch', l, c, h: normalizeHue(h) }, 'oklch', 'rgb')
  const hex = formatHex(clamped)
  return hex ?? '#000000'
}

export function oklchColorAt(l: number, c: number, h: number): OklchTuple {
  const clamped = clampChroma({ mode: 'oklch', l, c, h: normalizeHue(h) }, 'oklch', 'rgb')
  const asOklch = oklch(clamped)
  return {
    l: asOklch.l ?? l,
    c: asOklch.c ?? c,
    h: normalizeHue(asOklch.h ?? h),
  }
}

export type OklchTuple = { l: number; c: number; h: number }

function hueDeltaDegrees(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Weighted OKLCH distance; hue uses shortest arc normalized to 0–1 (÷180). */
export function distanceOklch(
  a: OklchTuple,
  b: OklchTuple,
  weights: OklchDistanceWeights = DEFAULT_DISTANCE_WEIGHTS,
): number {
  const dL = (a.l - b.l) * weights.lightness
  const dC = (a.c - b.c) * weights.chroma
  const dH = (hueDeltaDegrees(a.h, b.h) / 180) * weights.hue
  return Math.sqrt(dL * dL + dC * dC + dH * dH)
}

export function hexFromOklchTuple(t: OklchTuple): string {
  return oklchToHex(t.l, t.c, t.h)
}

function channelByte(v: number): string {
  return Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, '0')
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.min(1, Math.max(0, alpha))
  const base = hex.length === 9 ? `#${hex.slice(1, 7)}` : hex
  if (a >= 0.999) return base
  const rgb = toRgb(base)
  if (!rgb || rgb.r == null) return base
  return `#${channelByte(rgb.r)}${channelByte(rgb.g ?? 0)}${channelByte(rgb.b ?? 0)}${channelByte(a)}`
}
