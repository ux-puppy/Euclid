import type { ChartSpec } from '../chart-spec/types'
import { generateBaseColors } from './paletteGenerator'
import { assignmentIndex } from './categoryAssignment'
import {
  baseThemedHex,
  depthLevelHex,
  hierarchyLevelHex,
} from './variantGenerator'
import type {
  ChartTheme,
  ResolvedVisualizationColors,
  TreeRowColorInput,
  VisualizationPaletteConfig,
} from './types'

export function requiredColorCount(spec: ChartSpec): number {
  if (spec.data.shape === 'tabular') {
    return Math.max(spec.data.series.length, spec.data.categories.length, 1)
  }
  const breadth = treeTopLevelIds(spec).length
  return Math.max(breadth, 1)
}

export function maxTreeDepth(spec: ChartSpec): number {
  if (spec.data.shape !== 'tree') return 0
  let max = 0
  const walk = (node: import('../chart-spec/types').DataNode, depth: number) => {
    max = Math.max(max, depth)
    node.children?.forEach((c) => walk(c, depth + 1))
  }
  const root = spec.data.root
  if (root.id === 'virtual-root' && root.children) {
    root.children.forEach((c) => walk(c, 0))
  } else {
    walk(root, 0)
  }
  return max + 1
}

function treeTopLevelIds(spec: ChartSpec): string[] {
  if (spec.data.shape !== 'tree') return []
  const root = spec.data.root
  if (root.id === 'virtual-root' && root.children) {
    return root.children.map((c) => c.id)
  }
  return [root.id]
}

function seriesIds(spec: ChartSpec): string[] {
  if (spec.data.shape !== 'tabular') return []
  return spec.data.series.map((s) => s.id)
}

export function resolveVisualizationColors(
  config: VisualizationPaletteConfig,
  spec: ChartSpec,
  theme: ChartTheme,
): ResolvedVisualizationColors {
  const count = requiredColorCount(spec)
  const baseColors = generateBaseColors(config, count)
  const seriesByIndex = baseColors.map((b) =>
    baseThemedHex(b.hue, config, theme),
  )

  const depthLevels = maxTreeDepth(spec)
  const depthByLevel: string[] = []
  for (let d = 0; d < depthLevels; d++) {
    depthByLevel.push(depthLevelHex(d, config, theme))
  }

  const tabularIds = seriesIds(spec)

  const colorForSeriesIndex = (index: number): string => {
    const id = tabularIds[index]
    const assignIdx =
      id != null
        ? assignmentIndex(config.assignments, id, index)
        : index
    const base = baseColors[assignIdx % baseColors.length]
    if (!base) return seriesByIndex[index % seriesByIndex.length] ?? '#888'
    return baseThemedHex(base.hue, config, theme)
  }

  const colorForTreeRow = (row: TreeRowColorInput): string => {
    if (row.explicitColor) return row.explicitColor

    if (config.hierarchyMode === 'globalDepth') {
      return depthByLevel[row.depth % depthByLevel.length] ?? seriesByIndex[0]!
    }

    const branchId = row.branchRootId
    if (!branchId) {
      return depthLevelHex(row.depthInBranch, config, theme)
    }
    const idx = assignmentIndex(config.assignments, branchId, 0)
    const base = baseColors[idx % baseColors.length]
    const hue = base?.hue ?? config.startHue
    return hierarchyLevelHex(hue, row.depthInBranch, config, theme)
  }

  return {
    seriesByIndex,
    depthByLevel,
    baseColors,
    colorForSeriesIndex,
    colorForTreeRow,
  }
}

/** Preview palette for UI without full spec context. */
export function resolvePalettePreview(
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
  colorCount: number,
): string[] {
  const bases = generateBaseColors(config, colorCount)
  return bases.map((b) => baseThemedHex(b.hue, config, theme))
}
