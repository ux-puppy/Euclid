import { MAX_PALETTE_BASE_COUNT } from './constants'
import type {
  ExcessColorHandling,
  HueLayout,
  VisualizationPaletteConfig,
} from './types'

const DEFAULT_ACCESSIBILITY = {
  minRatioOnBackground: 3,
  minRatioOnBarText: 4.5,
} as const
import { migrateBaseCorrection } from './baseCorrection'
import { hueFromHex } from './oklch'

/** Legacy default series[0] hue seed. */
const LEGACY_SERIES0 = '#b8a9e8'

export const DEFAULT_EXCESS_COLOR_HANDLING: ExcessColorHandling = {
  enabled: true,
  activateAfter: 12,
  mode: 'repeatWithShift',
  shiftDegrees: 15,
  step: 0.08,
  opacityStep: 0,
}

export function resolveExcessColorHandling(
  config: Pick<
    VisualizationPaletteConfig,
    'excessColorHandling' | 'maxBaseColors' | 'variation'
  >,
): ExcessColorHandling {
  const d = DEFAULT_EXCESS_COLOR_HANDLING
  const legacyMax = Math.min(
    MAX_PALETTE_BASE_COUNT,
    Math.max(2, config.maxBaseColors ?? d.activateAfter),
  )
  if (!config.excessColorHandling) {
    return {
      ...d,
      activateAfter: legacyMax,
      shiftDegrees: 360 / (2 * legacyMax),
      step: config.variation?.step ?? d.step,
      opacityStep: config.variation?.opacityStep ?? d.opacityStep,
    }
  }
  const e = config.excessColorHandling
  const activateAfter = Math.min(
    MAX_PALETTE_BASE_COUNT,
    Math.max(2, e.activateAfter ?? legacyMax),
  )
  return {
    enabled: e.enabled ?? d.enabled,
    activateAfter,
    mode: e.mode ?? d.mode,
    shiftDegrees: e.shiftDegrees ?? 360 / (2 * activateAfter),
    step: e.step ?? config.variation?.step ?? d.step,
    opacityStep: e.opacityStep ?? config.variation?.opacityStep ?? d.opacityStep,
  }
}

export const DEFAULT_VISUALIZATION_PALETTE: VisualizationPaletteConfig = {
  startHue: hueFromHex(LEGACY_SERIES0) ?? 285,
  base: { lightnessCorrection: 1, chromaCorrection: 1 },
  lightMode: { lightness: 0.58, chroma: 0.14 },
  darkMode: { lightness: 0.72, chroma: 0.12 },
  distanceWeights: { lightness: 1, chroma: 1, hue: 1 },
  hueLayout: 'even',
  paletteRevision: 2,
  variation: {
    property: 'lightness',
    step: 0.08,
    direction: 'lighter',
    opacityStep: 0,
    opacityDirection: 'decrease',
  },
  maxBaseColors: 12,
  excessColorHandling: { ...DEFAULT_EXCESS_COLOR_HANDLING },
  hierarchyMode: 'globalDepth',
  assignments: {},
  accessibility: { ...DEFAULT_ACCESSIBILITY },
}

/** Even spacing for N ≤ 12; legacy autosave (revision &lt; 2) defaulted to `greedy`. */
export function resolveHueLayout(
  config: Pick<VisualizationPaletteConfig, 'hueLayout' | 'paletteRevision'>,
  fallback: HueLayout = DEFAULT_VISUALIZATION_PALETTE.hueLayout,
): HueLayout {
  const raw = config.hueLayout ?? fallback
  const revision = config.paletteRevision ?? 1
  if (raw === 'greedy' && revision < 2) return 'even'
  return raw
}

/** Fill fields added after schema updates (e.g. distance weights). */
export function normalizePaletteConfig(
  config: VisualizationPaletteConfig,
): VisualizationPaletteConfig {
  const d = DEFAULT_VISUALIZATION_PALETTE
  const merged = {
    ...d,
    ...config,
    variation: { ...d.variation, ...config.variation },
  }
  const excess = resolveExcessColorHandling(merged)
  return {
    ...merged,
    base: migrateBaseCorrection({
      ...d.base,
      ...(config.base as Record<string, unknown>),
    }),
    lightMode: { ...d.lightMode, ...config.lightMode },
    darkMode: { ...d.darkMode, ...config.darkMode },
    distanceWeights: { ...d.distanceWeights, ...config.distanceWeights },
    hueLayout: resolveHueLayout(config, d.hueLayout),
    paletteRevision: Math.max(config.paletteRevision ?? 1, d.paletteRevision ?? 2),
    excessColorHandling: excess,
    maxBaseColors: excess.enabled ? excess.activateAfter : MAX_PALETTE_BASE_COUNT,
    assignments: config.assignments ?? d.assignments,
    accessibility: {
      ...DEFAULT_ACCESSIBILITY,
      ...config.accessibility,
    },
  }
}
