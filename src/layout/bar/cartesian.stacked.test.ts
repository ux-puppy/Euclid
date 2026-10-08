import { describe, expect, it } from 'vitest'
import { createClassicSpec } from '../../chart-spec/defaults'
import { applyUnifiedDataToBundle, DEFAULT_UNIFIED_DATA } from '../../data/unifiedData'
import { computeCartesianLayout } from './cartesian'

describe('cartesian stacked layout', () => {
  it('stacks series segments per category on classic bar chart', () => {
    const bundle = {
      classic: createClassicSpec(),
      breakdown: createClassicSpec(),
      hierarchy: createClassicSpec(),
    }
    applyUnifiedDataToBundle(bundle, DEFAULT_UNIFIED_DATA)
    const spec = bundle.classic
    expect(spec.data.shape).toBe('tabular')
    if (spec.data.shape !== 'tabular') throw new Error('expected tabular')
    expect(spec.data.composition?.categories).toEqual(
      spec.data.series.map((s) => s.name),
    )

    spec.layout.barLayout = 'stacked'
    const scene = computeCartesianLayout(spec, 'dark', null, null, 1)
    const categoryCount = DEFAULT_UNIFIED_DATA.categoryCount
    const seriesCount = DEFAULT_UNIFIED_DATA.seriesCount

    expect(scene.barRows.length).toBe(categoryCount * seriesCount)

    for (let ci = 0; ci < categoryCount; ci++) {
      const rows = scene.barRows.filter((r) => r.id.split('-').pop() === String(ci))
      expect(rows.length).toBe(seriesCount)
      const ys = new Set(rows.map((r) => r.y))
      expect(ys.size).toBe(1)
      const xs = rows.map((r) => r.barX).sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i]!).toBeGreaterThanOrEqual(xs[i - 1]!)
      }
    }

    const plotRight =
      spec.layout.padding.left + (spec.layout.width - spec.layout.padding.left - spec.layout.padding.right)
    for (const row of scene.barRows) {
      expect(row.barX + row.barWidth).toBeLessThanOrEqual(plotRight + 0.5)
    }
  })
})
