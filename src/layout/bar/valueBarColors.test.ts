import { describe, expect, it } from 'vitest'
import { createClassicSpec } from '../../chart-spec/defaults'
import { applyUnifiedDataToBundle, DEFAULT_UNIFIED_DATA } from '../../data/unifiedData'
import { computeCartesianLayout } from './cartesian'
import { barFillForValue } from './valueBarColors'

describe('valueBarColors stacked', () => {
  it('maps segment values across composition grid domain', () => {
    const bundle = {
      classic: createClassicSpec(),
      breakdown: createClassicSpec(),
      hierarchy: createClassicSpec(),
    }
    applyUnifiedDataToBundle(bundle, DEFAULT_UNIFIED_DATA)
    const spec = bundle.classic
    spec.layout.barLayout = 'stacked'
    spec.colors.encoding = 'value'

    const scene = computeCartesianLayout(spec, 'dark', null, null, 1)
    const fills = new Set(scene.barRows.map((r) => r.fill))
    expect(fills.size).toBeGreaterThan(1)

    const low = barFillForValue(spec, 5, 'dark')
    const high = barFillForValue(spec, 95, 'dark')
    expect(low).not.toBe(high)
  })
})
