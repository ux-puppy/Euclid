import type { ChartSpec } from '../../chart-spec/types'
import { isBarChartSpec, isHeatmapChartSpec } from '../../chart-spec/types'
import type { ChartTheme } from '../../visualization-colors/types'
import { computeHeatmapLayout } from '../heatmap/computeLayout'
import { computeCartesianLayout } from './cartesian'
import { computeListLayout } from './list'
import type { SceneGraph } from './types'
import type { ValueAnimState } from './valueAnim'

const emptyHeatmapExtras = {
  heatmapCells: [] as SceneGraph['heatmapCells'],
  heatmapColorLegend: null as SceneGraph['heatmapColorLegend'],
}

export function computeLayout(
  spec: ChartSpec,
  ui: {
    theme: ChartTheme
    hoverId: string | null
    selectId: string | null
    expandedIds: readonly string[]
    collapsedIds: readonly string[]
    animProgress: number
    valueAnim?: ValueAnimState
    animElapsedMs?: number
    treeRevealAnimStart?: number | null
    treeRevealRowIds?: readonly string[]
    treeHideRowIds?: readonly string[]
    treeAnimUseBeforeLayout?: boolean
    treeAnimLayoutExpanded?: readonly string[]
    treeAnimLayoutCollapsed?: readonly string[]
  },
): SceneGraph {
  if (isHeatmapChartSpec(spec)) {
    return computeHeatmapLayout(
      spec,
      ui.theme,
      ui.hoverId,
      ui.selectId,
      ui.animProgress,
    )
  }
  if (isBarChartSpec(spec) && spec.layout.mode === 'cartesian') {
    const scene = computeCartesianLayout(
      spec,
      ui.theme,
      ui.hoverId,
      ui.selectId,
      ui.animProgress,
      ui.valueAnim,
    )
    return { ...scene, ...emptyHeatmapExtras }
  }
  const expandedIds =
    ui.treeRevealAnimStart != null && ui.treeAnimUseBeforeLayout
      ? ui.treeAnimLayoutExpanded ?? ui.expandedIds
      : ui.expandedIds
  const collapsedIds =
    ui.treeRevealAnimStart != null && ui.treeAnimUseBeforeLayout
      ? ui.treeAnimLayoutCollapsed ?? ui.collapsedIds
      : ui.collapsedIds
  if (!isBarChartSpec(spec)) {
    throw new Error('Invalid bar list layout input')
  }
  const scene = computeListLayout(
    spec,
    ui.theme,
    ui.hoverId,
    ui.selectId,
    expandedIds,
    collapsedIds,
    ui.animProgress,
    ui.animElapsedMs ?? 0,
    ui.treeRevealAnimStart ?? null,
    ui.treeRevealRowIds ?? [],
    ui.treeHideRowIds ?? [],
    ui.valueAnim,
  )
  return { ...scene, ...emptyHeatmapExtras }
}
