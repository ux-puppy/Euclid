import type { TabularData } from '../../chart-spec/types'

function categoryTotal(data: TabularData, categoryIndex: number): number {
  return data.series.reduce((sum, ser) => sum + (ser.values[categoryIndex] ?? 0), 0)
}

/** Scale domain so the widest bar (stack total or grouped value) fits plot width. */
export function cartesianValueExtent(
  data: TabularData,
  barLayout: 'grouped' | 'stacked',
): [min: number, max: number] {
  const flat = data.series.flatMap((s) => s.values)
  let minV = flat.length ? Math.min(0, ...flat) : 0
  let maxV = flat.length ? Math.max(...flat) : 0.01

  if (barLayout === 'stacked') {
    for (let ci = 0; ci < data.categories.length; ci++) {
      const total = categoryTotal(data, ci)
      minV = Math.min(minV, total)
      maxV = Math.max(maxV, total)
    }
  }

  if (maxV <= minV) maxV = minV + 0.01
  return [minV, maxV]
}
