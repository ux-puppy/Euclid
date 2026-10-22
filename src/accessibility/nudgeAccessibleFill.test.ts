import { describe, expect, it } from 'vitest'
import { createInitialSpecsBundle } from '../chart-spec/defaults'
import { resolveSurfaceForTheme } from '../chart-spec/surfaceColors'
import { DEFAULT_VISUALIZATION_PALETTE } from '../visualization-colors/defaults'
import { resolveVisualizationColors } from '../visualization-colors/resolve'
import {
  contrastRatioFillOnBackground,
  contrastRatioVizTextOnFill,
} from './contrast'
import { nudgeAccessibleFill } from './nudgeAccessibleFill'

function passesBoth(
  fill: string,
  ctx: {
    background: string
    textSecondary: string
    minRatioOnBackground: number
    minRatioOnBarText: number
  },
): boolean {
  const onBg = contrastRatioFillOnBackground(fill, ctx.background)
  const onBar = contrastRatioVizTextOnFill(ctx.textSecondary, fill)
  return (
    onBg != null &&
    onBar != null &&
    onBg >= ctx.minRatioOnBackground &&
    onBar >= ctx.minRatioOnBarText
  )
}

describe('nudgeAccessibleFill', () => {
  it('returns input when already passing', () => {
    const ctx = {
      background: '#ffffff',
      textSecondary: '#1a1a1a',
      minRatioOnBackground: 3,
      minRatioOnBarText: 4.5,
    }
    const fill = '#8a9199'
    expect(passesBoth(fill, ctx)).toBe(true)
    expect(nudgeAccessibleFill(fill, ctx)).toBe(fill)
  })

  it('nudges a failing categorical fill to pass both thresholds', () => {
    const spec = createInitialSpecsBundle().classic
    const thresholds = {
      minRatioOnBackground: 4.5,
      minRatioOnBarText: 4.5,
    }
    const config = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      lightMode: { lightness: 0.92, chroma: 0.04 },
      accessibility: thresholds,
    }
    const fill = resolveVisualizationColors(config, spec, 'light').colorForSeriesIndex(0)
    const surface = resolveSurfaceForTheme(spec.colors, 'light')
    const ctx = {
      background: surface.background,
      textSecondary: surface.textSecondary,
      ...thresholds,
    }
    expect(passesBoth(fill, ctx)).toBe(false)
    const out = nudgeAccessibleFill(fill, ctx)
    expect(out).not.toBe(fill)
    expect(passesBoth(out, ctx)).toBe(true)
  })
})
