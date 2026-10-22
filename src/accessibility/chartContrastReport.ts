import type { ChartSpec } from '../chart-spec/types'
import { resolveSurfaceForTheme } from '../chart-spec/surfaceColors'
import type { AccessibilityContrastThresholds, ChartTheme, VisualizationPaletteConfig } from '../visualization-colors/types'
import { requiredColorCount, resolveVisualizationColors } from '../visualization-colors/resolve'
import { compositeOver, contrastRatio, contrastRatioFillOnBackground } from './contrast'

export type PaletteAccessibilitySlot = {
  fill: string
  ratioOnBackground: number | null
  ratioOnBarText: number | null
  passOnBackground: boolean
  passOnBarText: boolean
}

export const ACCESSIBILITY_SLOT_DISPLAY = 8

const DEFAULT_THRESHOLDS: AccessibilityContrastThresholds = {
  minRatioOnBackground: 3,
  minRatioOnBarText: 4.5,
}

export function resolveAccessibilityThresholds(
  config: VisualizationPaletteConfig,
): AccessibilityContrastThresholds {
  const d = DEFAULT_THRESHOLDS
  return {
    minRatioOnBackground:
      config.accessibility?.minRatioOnBackground ?? d.minRatioOnBackground,
    minRatioOnBarText: config.accessibility?.minRatioOnBarText ?? d.minRatioOnBarText,
  }
}

function passes(ratio: number | null, min: number): boolean {
  return ratio != null && ratio >= min
}

export function paletteAccessibilitySlots(
  spec: ChartSpec,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
  slotCount = ACCESSIBILITY_SLOT_DISPLAY,
): PaletteAccessibilitySlot[] {
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const thresholds = resolveAccessibilityThresholds(config)
  const viz = resolveVisualizationColors(config, spec, theme)
  const n = Math.min(requiredColorCount(spec), slotCount)
  const slots: PaletteAccessibilitySlot[] = []

  for (let i = 0; i < slotCount; i++) {
    if (i >= n) {
      slots.push({
        fill: 'transparent',
        ratioOnBackground: null,
        ratioOnBarText: null,
        passOnBackground: false,
        passOnBarText: false,
      })
      continue
    }
    const fill = viz.colorForSeriesIndex(i)
    const ratioOnBackground = contrastRatioFillOnBackground(fill, surface.background)
    const visibleFill = compositeOver(fill, surface.background)
    const ratioOnBarText = contrastRatio(surface.textSecondary, visibleFill)
    const passOnBackground = passes(ratioOnBackground, thresholds.minRatioOnBackground)
    const passOnBarText = passes(ratioOnBarText, thresholds.minRatioOnBarText)
    slots.push({
      fill,
      ratioOnBackground,
      ratioOnBarText,
      passOnBackground,
      passOnBarText,
    })
  }
  return slots
}
