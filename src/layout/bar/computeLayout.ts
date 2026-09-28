import type { ChartSpec } from '../../chart-spec/types'
import type { ChartTheme } from '../../visualization-colors/types'
import { computeCartesianLayout } from './cartesian'
import { computeListLayout } from './list'
import type { SceneGraph } from './types'
import type { ValueAnimState } from './valueAnim'

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
  if (spec.layout.mode === 'cartesian') {
    return computeCartesianLayout(
      spec,
      ui.theme,
      ui.hoverId,
      ui.selectId,
      ui.animProgress,
      ui.valueAnim,
    )
  }
  const expandedIds =
    ui.treeRevealAnimStart != null && ui.treeAnimUseBeforeLayout
      ? ui.treeAnimLayoutExpanded ?? ui.expandedIds
      : ui.expandedIds
  const collapsedIds =
    ui.treeRevealAnimStart != null && ui.treeAnimUseBeforeLayout
      ? ui.treeAnimLayoutCollapsed ?? ui.collapsedIds
      : ui.collapsedIds
  return computeListLayout(
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
}
