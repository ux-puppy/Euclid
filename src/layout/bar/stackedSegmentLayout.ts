import type { ScaleLinear } from 'd3-scale'
import type { TabularData } from '../../chart-spec/types'
import { resolveBarWidth, type ValueAnimState } from './valueAnim'

export type StackedSegmentLayout = {
  seriesIndex: number
  raw: number
  x: number
  width: number
}

export function layoutStackedSegments(
  data: TabularData,
  categoryIndex: number,
  valueScale: ScaleLinear<number, number>,
  paddingLeft: number,
  stackGap: number,
  loadProgress: number,
  valueAnim?: ValueAnimState,
): StackedSegmentLayout[] {
  const n = data.series.length
  const total = data.series.reduce(
    (sum, ser) => sum + (ser.values[categoryIndex] ?? 0),
    0,
  )
  const origin = valueScale(0)!
  const end = valueScale(total)!
  const fullW = Math.abs(end - origin)
  const gapTotal = stackGap * Math.max(0, n - 1)
  const segTrack = Math.max(0, fullW - gapTotal)
  const startX = paddingLeft + Math.min(origin, end)

  let runX = startX
  const out: StackedSegmentLayout[] = []

  for (let si = 0; si < n; si++) {
    const raw = data.series[si]!.values[categoryIndex] ?? 0
    const targetW = total > 0 ? (raw / total) * segTrack : 0
    const id = `${data.series[si]!.id}-${categoryIndex}`
    const width = resolveBarWidth(id, targetW, loadProgress, valueAnim)
    out.push({ seriesIndex: si, raw, x: runX, width })
    runX += width + (si < n - 1 ? stackGap : 0)
  }

  return out
}
