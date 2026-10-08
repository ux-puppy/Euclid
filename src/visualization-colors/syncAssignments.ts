import type { BarChartSpec } from '../chart-spec/types'
import { isBarChartSpec } from '../chart-spec/types'
import type { ChartSpec } from '../chart-spec/types'
import { reconcileAssignments } from './categoryAssignment'
import { requiredColorCount } from './resolve'

export function orderedAssignmentIds(spec: ChartSpec): string[] {
  if (spec.data.shape === 'tabular') {
    return spec.data.series.map((s) => s.id)
  }
  const root = spec.data.root
  if (root.id === 'virtual-root' && root.children) {
    return root.children.map((c) => c.id)
  }
  return [root.id]
}

export function syncPaletteAssignments(spec: ChartSpec): void {
  if (!isBarChartSpec(spec)) return
  syncBarPaletteAssignments(spec)
}

export function syncBarPaletteAssignments(spec: BarChartSpec): void {
  const ids = orderedAssignmentIds(spec)
  const paletteSize = Math.max(requiredColorCount(spec), ids.length, 1)
  spec.colors.visualization.assignments = reconcileAssignments(
    ids,
    spec.colors.visualization.assignments,
    paletteSize,
  )
}
