import { describe, expect, it } from 'vitest'
import type { ChartSpec } from '../chart-spec/types'
import { DEFAULT_VISUALIZATION_PALETTE } from './defaults'
import { generateBaseColors } from './paletteGenerator'
import { requiredColorCount, resolvePalettePreview } from './resolve'

function tabularSpec(seriesCount: number, categoryCount: number): ChartSpec {
  return {
    chartType: 'bar',
    variant: 'breakdown',
    data: {
      shape: 'tabular',
      categories: Array.from({ length: categoryCount }, (_, i) => `C${i}`),
      series: Array.from({ length: seriesCount }, (_, i) => ({
        id: `s-${i}`,
        name: `S${i}`,
        values: Array.from({ length: categoryCount }, () => 1),
      })),
      provenance: null,
    },
    layout: {} as ChartSpec['layout'],
    colors: { visualization: DEFAULT_VISUALIZATION_PALETTE, surfaceByTheme: {} as ChartSpec['colors']['surfaceByTheme'] },
  } as ChartSpec
}

describe('requiredColorCount', () => {
  it('uses series length, not category count', () => {
    expect(requiredColorCount(tabularSpec(3, 8))).toBe(3)
  })
})

describe('palette preview with series count', () => {
  it('spaces three series evenly around the wheel', () => {
    const spec = tabularSpec(3, 8)
    const cfg = { ...DEFAULT_VISUALIZATION_PALETTE, startHue: 0, hueLayout: 'even' as const }
    const count = requiredColorCount(spec)
    expect(count).toBe(3)
    const hues = generateBaseColors(cfg, count).map((b) => b.hue)
    expect(hues[1]).toBeCloseTo(240, 5)
    expect(hues[2]).toBeCloseTo(120, 5)
    const preview = resolvePalettePreview(cfg, 'light', count)
    expect(preview).toHaveLength(3)
  })
})
