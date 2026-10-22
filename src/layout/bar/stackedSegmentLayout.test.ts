import { scaleLinear } from 'd3-scale'
import { describe, expect, it } from 'vitest'
import type { TabularData } from '../../chart-spec/types'
import { layoutStackedSegments } from './stackedSegmentLayout'

const data: TabularData = {
  shape: 'tabular',
  categories: ['A'],
  series: [
    { id: 's0', name: 'a', values: [0.5] },
    { id: 's1', name: 'b', values: [0.5] },
  ],
  provenance: null,
}

describe('layoutStackedSegments', () => {
  it('inserts pixel gaps without exceeding total bar width', () => {
    const plotW = 200
    const scale = scaleLinear().domain([0, 1]).range([0, plotW])
    const gap = 8
    const segs = layoutStackedSegments(data, 0, scale, 24, gap, 1)
    expect(segs).toHaveLength(2)
    expect(segs[0]!.width + gap + segs[1]!.width).toBeCloseTo(plotW, 5)
    expect(segs[1]!.x - (segs[0]!.x + segs[0]!.width)).toBeCloseTo(gap, 5)
  })
})
