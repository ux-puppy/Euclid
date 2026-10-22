import { createClassicSpec } from '../chart-spec/defaults'
import type { BarChartSpec } from '../chart-spec/types'

/** Bar spec for isolated palette demos (series count drives base palette size). */
export function createDemoBarSpec(seriesCount: number): BarChartSpec {
  const n = Math.max(2, Math.min(16, seriesCount))
  const spec = createClassicSpec()
  spec.data = {
    shape: 'tabular',
    categories: Array.from({ length: 6 }, (_, i) => `Category ${i + 1}`),
    series: Array.from({ length: n }, (_, i) => ({
      id: `s-${i}`,
      name: `Series ${i + 1}`,
      values: Array.from({ length: 6 }, (_, j) => 20 + ((i * 7 + j * 11) % 80)),
    })),
    provenance: null,
  }
  return spec
}
