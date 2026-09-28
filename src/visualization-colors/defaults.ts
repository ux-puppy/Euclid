import type { VisualizationPaletteConfig } from './types'
import { migrateBaseCorrection } from './baseCorrection'
import { hueFromHex } from './oklch'

/** Legacy default series[0] hue seed. */
const LEGACY_SERIES0 = '#b8a9e8'

export const DEFAULT_VISUALIZATION_PALETTE: VisualizationPaletteConfig = {
  startHue: hueFromHex(LEGACY_SERIES0) ?? 285,
  base: { lightnessCorrection: 1, chromaCorrection: 1 },
  lightMode: { lightness: 0.58, chroma: 0.14 },
  darkMode: { lightness: 0.72, chroma: 0.12 },
  distanceWeights: { lightness: 1, chroma: 1, hue: 1 },
  variation: {
    property: 'lightness',
    step: 0.08,
    direction: 'lighter',
    opacityStep: 0,
    opacityDirection: 'decrease',
  },
  maxBaseColors: 12,
  hierarchyMode: 'globalDepth',
  assignments: {},
}

/** Fill fields added after schema updates (e.g. distance weights). */
export function normalizePaletteConfig(
  config: VisualizationPaletteConfig,
): VisualizationPaletteConfig {
  const d = DEFAULT_VISUALIZATION_PALETTE
  return {
    ...d,
    ...config,
    base: migrateBaseCorrection({
      ...d.base,
      ...(config.base as Record<string, unknown>),
    }),
    lightMode: { ...d.lightMode, ...config.lightMode },
    darkMode: { ...d.darkMode, ...config.darkMode },
    distanceWeights: { ...d.distanceWeights, ...config.distanceWeights },
    variation: { ...d.variation, ...config.variation },
    assignments: config.assignments ?? d.assignments,
  }
}
