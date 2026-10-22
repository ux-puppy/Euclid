import { nudgedFillForBaseIndex } from './accessibilityNudge'
import type { BarChartSpec, ChartSpec } from '../chart-spec/types'
import { isBarChartSpec } from '../chart-spec/types'
import { normalizePaletteConfig } from './defaults'
import { generateBaseColors } from './paletteGenerator'
import { assignmentIndex } from './categoryAssignment'
import {
  depthLevelHex,
  hexFromBaseVisualizationColor,
  hierarchyLevelHex,
} from './variantGenerator'
import type {
  ChartTheme,
  ResolvedVisualizationColors,
  TreeRowColorInput,
  VisualizationPaletteConfig,
} from './types'

/** Distinct base palette slots (one hue per tabular series / top-level tree branch). */
export function requiredColorCount(spec: ChartSpec): number {
  if (!isBarChartSpec(spec)) return 1
  return requiredBarColorCount(spec)
}

export function requiredBarColorCount(spec: BarChartSpec): number {
  if (spec.data.shape === 'tabular') {
    return Math.max(spec.data.series.length, 1)
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

function applyBakedNudge(
  baseIndex: number,
  hex: string,
  config: VisualizationPaletteConfig,
): string {
  return nudgedFillForBaseIndex(config, baseIndex, hex)
}

export function resolveVisualizationColors(
  config: VisualizationPaletteConfig,
  spec: ChartSpec,
  theme: ChartTheme,
): ResolvedVisualizationColors {
  const normalized = normalizePaletteConfig(config)
  const count = requiredColorCount(spec)
  const baseColors = generateBaseColors(config, count)
  const seriesByIndex = baseColors.map((b, i) =>
    applyBakedNudge(
      i,
      hexFromBaseVisualizationColor(b, config, theme, count),
      config,
    ),
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
    return applyBakedNudge(
      assignIdx % baseColors.length,
      hexFromBaseVisualizationColor(base, config, theme, count),
      config,
    )
  }

  const colorForTreeRow = (row: TreeRowColorInput): string => {
    if (row.explicitColor) {
      return row.explicitColor
    }

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
  spec?: ChartSpec,
): string[] {
  return resolvePaletteSequence(config, theme, colorCount, spec).map((s) => s.hex)
}

/** Palette slots in generator order (updates when hue layout / smart ordering changes). */
export function resolvePaletteSequence(
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
  colorCount: number,
  spec?: ChartSpec,
): { sequence: number; hex: string }[] {
  const n = Math.max(1, colorCount)
  const bases = generateBaseColors(config, n)
  return bases.map((b, i) => {
    const raw = hexFromBaseVisualizationColor(b, config, theme, n)
    const hex = spec ? applyBakedNudge(i, raw, config) : raw
    return {
      sequence: i + 1,
      hex,
    }
  })
}
