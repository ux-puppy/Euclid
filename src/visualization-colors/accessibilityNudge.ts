import { nudgeAccessibleFill } from '../accessibility/nudgeAccessibleFill'
import { resolveAccessibilityThresholds } from '../accessibility/chartContrastReport'
import { resolveSurfaceForTheme } from '../chart-spec/surfaceColors'
import type { ChartSpec } from '../chart-spec/types'
import type { ChartTheme, VisualizationPaletteConfig } from './types'
import { generateBaseColors } from './paletteGenerator'
import { hexFromBaseVisualizationColor } from './variantGenerator'

export function stripNudgedFillsFromConfig(
  config: VisualizationPaletteConfig,
): VisualizationPaletteConfig {
  const acc = config.accessibility
  if (!acc?.nudgedFills?.length) return config
  const { nudgedFills: _removed, ...rest } = acc
  return {
    ...config,
    accessibility: Object.keys(rest).length > 0 ? rest : undefined,
  }
}

export function buildNudgedPaletteFills(
  config: VisualizationPaletteConfig,
  spec: ChartSpec,
  theme: ChartTheme,
  colorCount: number,
): string[] {
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const thresholds = resolveAccessibilityThresholds(config)
  const n = Math.max(1, colorCount)
  const bases = generateBaseColors(config, n)
  const ctx = {
    background: surface.background,
    textSecondary: surface.textSecondary,
    ...thresholds,
  }
  return bases.map((b) =>
    nudgeAccessibleFill(hexFromBaseVisualizationColor(b, config, theme, n), ctx),
  )
}

export function nudgedFillForBaseIndex(
  config: VisualizationPaletteConfig,
  baseIndex: number,
  generatedHex: string,
): string {
  const fills = config.accessibility?.nudgedFills
  const baked = fills?.[baseIndex]
  return baked ?? generatedHex
}
