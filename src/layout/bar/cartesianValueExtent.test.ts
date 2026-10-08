import { describe, expect, it } from 'vitest'
import type { TabularData } from '../../chart-spec/types'
import { cartesianValueExtent } from './cartesianValueExtent'

const sample: TabularData = {
  shape: 'tabular',
  categories: ['A', 'B'],
  series: [
    { id: 's0', name: 'x', values: [0.4, 0.2] },
    { id: 's1', name: 'y', values: [0.5, 0.3] },
  ],
  provenance: null,
}

describe('cartesianValueExtent', () => {
  it('uses category stack totals for stacked layout', () => {
    const [, max] = cartesianValueExtent(sample, 'stacked')
    expect(max).toBe(0.9)
  })

  it('uses segment max for grouped layout', () => {
    const [, max] = cartesianValueExtent(sample, 'grouped')
    expect(max).toBe(0.5)
  })
})
