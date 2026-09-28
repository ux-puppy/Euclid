import type { VisualizationPaletteConfig } from './types'
import { DEFAULT_VISUALIZATION_PALETTE } from './defaults'
import { hueFromHex } from './oklch'

/** v1 ColorTokens shape (series + depth arrays). */
export type LegacyColorTokens = {
  background: string
  text: string
  textSecondary: string
  axis: string
  grid: string
  series: string[]
  depth: string[]
  hover: string
  selected: string
  tooltip: string
  border: string
}

export function migrateVisualizationFromLegacy(
  legacy: LegacyColorTokens,
): VisualizationPaletteConfig {
  const startHue =
    hueFromHex(legacy.series[0] ?? '') ??
    hueFromHex(legacy.depth[0] ?? '') ??
    DEFAULT_VISUALIZATION_PALETTE.startHue

  return {
    ...DEFAULT_VISUALIZATION_PALETTE,
    startHue,
    assignments: {},
  }
}

export function legacySurfaceFromTokens(
  legacy: LegacyColorTokens,
): Omit<LegacyColorTokens, 'series' | 'depth'> {
  const { series: _s, depth: _d, ...surface } = legacy
  return surface
}
