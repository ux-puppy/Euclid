import { describe, expect, it } from 'vitest'
import { createClassicSpec, createInitialSpecsBundle } from '../../chart-spec/defaults'
import { applyUnifiedDataToBundle, DEFAULT_UNIFIED_DATA } from '../../data/unifiedData'
import { computeCartesianLayout } from './cartesian'

describe('cartesian grouped layout', () => {
  it('classic grouped uses one row per species, not sub-bars per series count', () => {
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, DEFAULT_UNIFIED_DATA)
    const spec = bundle.classic
    spec.layout.barLayout = 'grouped'

    const scene = computeCartesianLayout(spec, 'dark', null, null, 1)
    const categoryCount = DEFAULT_UNIFIED_DATA.categoryCount

    expect(scene.barRows.length).toBe(categoryCount)
    const ys = scene.barRows.map((r) => r.y)
    expect(new Set(ys).size).toBe(categoryCount)

    const rowHeight = spec.geometry.barThickness + spec.geometry.groupGap
    for (let i = 1; i < categoryCount; i++) {
      expect(ys[i]! - ys[i - 1]!).toBeCloseTo(rowHeight, 0)
    }
  })

  it('classic grouped bar count ignores sample series count', () => {
    const spec = createClassicSpec()
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, { ...DEFAULT_UNIFIED_DATA, seriesCount: 2 })
    spec.data = bundle.classic.data
    spec.layout.barLayout = 'grouped'

    const few = computeCartesianLayout(spec, 'dark', null, null, 1)
    applyUnifiedDataToBundle(bundle, { ...DEFAULT_UNIFIED_DATA, seriesCount: 8 })
    spec.data = bundle.classic.data
    const many = computeCartesianLayout(spec, 'dark', null, null, 1)

    expect(few.barRows.length).toBe(many.barRows.length)
    expect(few.height).toBe(many.height)
    expect(many.barRows.map((r) => Math.round(r.width))).toEqual(
      few.barRows.map((r) => Math.round(r.width)),
    )
  })
})
