import {
  colorsToGradient,
  hasDivergingCenterStop,
  mergeDivergingLegsIntoSequential,
  normalizeDivergingGradientStops,
  normalizeGradientStops,
  splitDivergingSequential,
} from './gradientStops'
import type {
  HeatmapColorBlend,
  HeatmapColorConfig,
  HeatmapGradient,
  HeatmapInterpolation,
} from './types'

const LEGACY_SEQUENTIAL = ['#5A83D3', '#2A2A2A', '#E87A67']
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
  lightMode: { lightness: 0.72, chroma: 0.12 },
  darkMode: { lightness: 0.6, chroma: 0.09 },
  useStopAlpha: false,
  adaptInversion: true,
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

  const mode = raw.mode === 'diverging' ? 'diverging' : 'sequential'
  const divergingZero = raw.divergingZero ?? base.divergingZero
  let sequential = migrateGradient(raw.sequential, raw.sequentialStops, base.sequential)
  let negative = migrateGradient(raw.negative, raw.negativeStops, base.negative)
  let positive = migrateGradient(raw.positive, raw.positiveStops, base.positive)

  if (mode === 'diverging') {
    if (!hasDivergingCenterStop(sequential.stops)) {
      sequential = mergeDivergingLegsIntoSequential(negative, positive, divergingZero)
    } else {
      sequential = {
        stops: normalizeDivergingGradientStops(sequential.stops, divergingZero),
      }
    }
    const legs = splitDivergingSequential(sequential, divergingZero)
    negative = legs.negative
    positive = legs.positive
  }

  return {
    mode,
    interpolation,
    lightMode: { ...base.lightMode, ...raw.lightMode },
    darkMode: { ...base.darkMode, ...raw.darkMode },
    useStopAlpha: raw.useStopAlpha ?? base.useStopAlpha,
    adaptInversion: raw.adaptInversion ?? base.adaptInversion,
    sequential,
    divergingZero,
    negative,
    positive,
  }
}
