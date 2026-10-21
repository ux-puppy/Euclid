import { converter, formatHex } from 'culori'
import { oklchFromHex, oklchToHex } from '../visualization-colors/oklch'
import { attachAlpha, heatmapColorForOutput, lerpAlpha } from './colorAlpha'

const toRgb = converter('rgb')
import { mapScaleT } from './interpolation'
import { DIVERGING_CENTER, normalizeGradientStops, sortStops } from './gradientStops'
import type {
  HeatmapColorBlend,
  HeatmapColorConfig,
  HeatmapGradient,
  HeatmapValueDomain,
} from './types'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHue(a: number, b: number, t: number): number {
  let diff = b - a
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return ((a + diff * t) % 360 + 360) % 360
}

function lerpColorOklch(a: string, b: string, f: number): string {
  const okA = oklchFromHex(a)
  const okB = oklchFromHex(b)
  if (!okA || !okB) return f < 0.5 ? a : b
  const opaque = oklchToHex(
    lerp(okA.l, okB.l, f),
    lerp(okA.c, okB.c, f),
    lerpHue(okA.h, okB.h, f),
  )
  return attachAlpha(opaque, lerpAlpha(a, b, f))
}

function lerpColorSrgb(a: string, b: string, f: number): string {
  const ra = toRgb(a)
  const rb = toRgb(b)
  if (!ra || !rb) return f < 0.5 ? a : b
  const mixed = {
    mode: 'rgb' as const,
    r: lerp(ra.r ?? 0, rb.r ?? 0, f),
    g: lerp(ra.g ?? 0, rb.g ?? 0, f),
    b: lerp(ra.b ?? 0, rb.b ?? 0, f),
  }
  const opaque = formatHex(mixed) ?? (f < 0.5 ? a : b)
  return attachAlpha(opaque, lerpAlpha(a, b, f))
}

function lerpStopColors(a: string, b: string, f: number, colorBlend: HeatmapColorBlend): string {
  return colorBlend === 'srgb' ? lerpColorSrgb(a, b, f) : lerpColorOklch(a, b, f)
}

export function sampleGradientAt(
  gradient: HeatmapGradient,
  t: number,
  colorBlend: HeatmapColorBlend,
  useStopAlpha = true,
): string {
  const stops = sortStops(normalizeGradientStops(gradient.stops))
  const finish = (color: string) =>
    useStopAlpha ? color : heatmapColorForOutput(color, { useStopAlpha: false })

  if (stops.length === 0) return '#888888'
  const clamped = Math.max(0, Math.min(1, t))

  if (clamped <= stops[0]!.position) return finish(stops[0]!.color)
  if (clamped >= stops[stops.length - 1]!.position) {
    return finish(stops[stops.length - 1]!.color)
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!
    const b = stops[i + 1]!
    if (clamped >= a.position && clamped <= b.position) {
      const span = b.position - a.position
      const f = span <= 0 ? 0 : (clamped - a.position) / span
      return finish(lerpStopColors(a.color, b.color, f, colorBlend))
    }
  }
  return finish(stops[stops.length - 1]!.color)
}

/** Colors along gradient parameter 0…1 (for bar preview). */
export function sampleGradientStrip(
  gradient: HeatmapGradient,
  colorBlend: HeatmapColorBlend,
  steps = 48,
  useStopAlpha = true,
): string[] {
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = steps <= 1 ? 0.5 : i / (steps - 1)
    out.push(sampleGradientAt(gradient, t, colorBlend, useStopAlpha))
  }
  return out
}

export function domainFromValues(values: number[]): HeatmapValueDomain {
  if (values.length === 0) {
    return { min: 0, max: 1, hasNegative: false, hasPositive: true }
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  return {
    min,
    max: max === min ? min + 1 : max,
    hasNegative: min < 0,
    hasPositive: max > 0,
  }
}

function linearT(value: number, min: number, max: number): number {
  return max === min ? 0.5 : (value - min) / (max - min)
}

export function colorForHeatmapValue(
  value: number,
  domain: HeatmapValueDomain,
  config: HeatmapColorConfig,
): string {
  const { interpolation } = config
  const useStopAlpha = config.useStopAlpha

  if (config.mode === 'sequential') {
    const tLinear = linearT(value, domain.min, domain.max)
    const t = mapScaleT(tLinear, interpolation)
    return sampleGradientAt(config.sequential, t, interpolation.colorBlend, useStopAlpha)
  }

  if (value === 0 || (Math.abs(value) < 1e-12 && domain.min <= 0 && domain.max >= 0)) {
    return heatmapColorForOutput(config.divergingZero, config)
  }

  if (value < 0) {
    const negMin = Math.min(domain.min, 0)
    if (negMin === 0) return heatmapColorForOutput(config.divergingZero, config)
    const tLinear = (value - negMin) / (0 - negMin)
    const t = mapScaleT(tLinear, interpolation) * DIVERGING_CENTER
    return sampleGradientAt(config.sequential, t, interpolation.colorBlend, useStopAlpha)
  }

  const posMax = Math.max(domain.max, 0)
  if (posMax === 0) return heatmapColorForOutput(config.divergingZero, config)
  const tLinear = value / posMax
  const t = DIVERGING_CENTER + mapScaleT(tLinear, interpolation) * DIVERGING_CENTER
  return sampleGradientAt(config.sequential, t, interpolation.colorBlend, useStopAlpha)
}

/** Sample colors along data domain for legend rendering. */
export function sampleHeatmapLegend(
  config: HeatmapColorConfig,
  domain: HeatmapValueDomain,
  steps = 32,
): string[] {
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = steps <= 1 ? 0.5 : i / (steps - 1)
    if (config.mode === 'sequential') {
      const v = domain.min + t * (domain.max - domain.min)
      out.push(colorForHeatmapValue(v, domain, config))
    } else {
      if (t < 0.5) {
        const negMin = Math.min(domain.min, 0)
        const v = negMin + (t / 0.5) * (0 - negMin)
        out.push(colorForHeatmapValue(v, domain, config))
      } else if (Math.abs(t - 0.5) < 0.5 / steps) {
        out.push(config.divergingZero)
      } else {
        const posMax = Math.max(domain.max, 0)
        const local = (t - 0.5) / 0.5
        const v = local * posMax
        out.push(colorForHeatmapValue(v, domain, config))
      }
    }
  }
  return out
}
