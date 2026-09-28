import type { TabularPatternId, TreePatternId } from '../../../chart-spec/types'

const TABULAR_LABELS: Record<TabularPatternId, string> = {
  random: 'Random distribution',
  increasing: 'Increasing',
  decreasing: 'Decreasing',
  'bell-curve': 'Bell curve',
  wave: 'Wave',
  'peaks-valleys': 'Peaks & valleys',
  uniform: 'Uniform',
  clustered: 'Clustered',
  outliers: 'Outliers',
  'positive-negative': 'Positive + negative',
  sparse: 'Sparse',
}

const TREE_LABELS: Record<TreePatternId, string> = {
  balanced: 'Balanced',
  skewed: 'Skewed',
  'wide-shallow': 'Wide shallow',
  'random-tree': 'Random tree',
}

export function formatPatternLabel(id: string): string {
  if (id in TABULAR_LABELS) return TABULAR_LABELS[id as TabularPatternId]
  if (id in TREE_LABELS) return TREE_LABELS[id as TreePatternId]
  return id.replace(/-/g, ' ')
}

export function tabularPatternOptions(): { value: TabularPatternId; label: string }[] {
  return (Object.keys(TABULAR_LABELS) as TabularPatternId[]).map((value) => ({
    value,
    label: TABULAR_LABELS[value],
  }))
}

export function treePatternOptions(): { value: TreePatternId; label: string }[] {
  return (Object.keys(TREE_LABELS) as TreePatternId[]).map((value) => ({
    value,
    label: TREE_LABELS[value],
  }))
}
