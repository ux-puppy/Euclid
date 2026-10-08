import { colorsToGradient, normalizeGradientStops } from './gradientStops'
import type {
  HeatmapColorBlend,
  HeatmapColorConfig,
  HeatmapGradient,
  HeatmapInterpolation,
} from './types'

const LEGACY_SEQUENTIAL = ['#1e3a5f', '#3d7ea6', '#81c3d7', '#f6f4d2', '#f4a261', '#e76f51']
const LEGACY_NEGATIVE = ['#1d3557', '#457b9d', '#a8dadc']
const LEGACY_POSITIVE = ['#ffe8a3', '#f4a261', '#e63946']

export const DEFAULT_INTERPOLATION: HeatmapInterpolation = {
  scale: 'linear',
  scaleQuantized: false,
  scaleLogBase: 10,
  scaleGamma: 1,
  scaleSteps: 5,
  colorBlend: 'oklch',
}

function normalizeScale(raw: unknown): HeatmapInterpolation['scale'] {
  if (raw === 'log' || raw === 'power') return raw
  return 'linear'
}

function normalizeColorBlend(raw: unknown): HeatmapColorBlend {
  if (raw === 'srgb') return 'srgb'
  // legacy: linear (OKLCH), step (removed)
  return 'oklch'
}

export const DEFAULT_HEATMAP_COLORS: HeatmapColorConfig = {
  mode: 'sequential',
  interpolation: { ...DEFAULT_INTERPOLATION },
  sequential: colorsToGradient(LEGACY_SEQUENTIAL),
  divergingZero: '#f8f9fa',
  negative: colorsToGradient(LEGACY_NEGATIVE),
  positive: colorsToGradient(LEGACY_POSITIVE),
}

function migrateGradient(
  gradient: HeatmapGradient | undefined,
  legacyColors: string[] | undefined,
  fallback: HeatmapGradient,
): HeatmapGradient {
  if (gradient?.stops?.length) {
    return { stops: normalizeGradientStops(gradient.stops) }
  }
  if (legacyColors?.length) {
    return colorsToGradient(legacyColors)
  }
  return { stops: normalizeGradientStops(fallback.stops) }
}

export function normalizeHeatmapColors(raw: Partial<HeatmapColorConfig> | undefined): HeatmapColorConfig {
  const base = structuredClone(DEFAULT_HEATMAP_COLORS)
  if (!raw) return base

  const legacyScale = raw.interpolation?.scale as string | undefined
  const interpolation: HeatmapInterpolation = {
    scale:
      legacyScale === 'step'
        ? 'linear'
        : normalizeScale(legacyScale ?? base.interpolation.scale),
    scaleQuantized:
      raw.interpolation?.scaleQuantized ??
      (legacyScale === 'step' ? true : base.interpolation.scaleQuantized),
    scaleLogBase: raw.interpolation?.scaleLogBase ?? base.interpolation.scaleLogBase,
    scaleGamma: raw.interpolation?.scaleGamma ?? base.interpolation.scaleGamma,
    scaleSteps: raw.interpolation?.scaleSteps ?? base.interpolation.scaleSteps,
    colorBlend: normalizeColorBlend(raw.interpolation?.colorBlend),
  }

  return {
    mode: raw.mode === 'diverging' ? 'diverging' : 'sequential',
    interpolation,
    sequential: migrateGradient(raw.sequential, raw.sequentialStops, base.sequential),
    divergingZero: raw.divergingZero ?? base.divergingZero,
    negative: migrateGradient(raw.negative, raw.negativeStops, base.negative),
    positive: migrateGradient(raw.positive, raw.positiveStops, base.positive),
  }
}
