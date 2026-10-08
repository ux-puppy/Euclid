import type {
  BarChartSpec,
  ChartVariant,
  DataNode,
  HeatmapChartSpec,
  TabularData,
  TabularPatternId,
  TreeData,
} from '../chart-spec/types'
import { DEFAULT_TREE_MAX_DEPTH } from '../chart-spec/constants'
import { generateTabularData } from './generate'
import { LOCAL_POPULATION_NAMES } from './patterns/animalLabels'

export type UnifiedDataParams = {
  pattern: TabularPatternId
  seriesPattern: TabularPatternId
  seed: number
  categoryCount: number
  seriesCount: number
  maxDepth: number
}

/** Bar charts do not support the signed heatmap pattern. */
export function barSafeTabularPattern(pattern: TabularPatternId): TabularPatternId {
  return pattern === 'positive-negative' ? 'random' : pattern
}

export function barUnifiedParams(params: UnifiedDataParams): UnifiedDataParams {
  return {
    ...params,
    pattern: barSafeTabularPattern(params.pattern),
    seriesPattern: barSafeTabularPattern(params.seriesPattern),
  }
}

export const DEFAULT_UNIFIED_DATA: UnifiedDataParams = {
  pattern: 'random',
  seriesPattern: 'random',
  seed: 42,
  categoryCount: 6,
  seriesCount: 5,
  maxDepth: DEFAULT_TREE_MAX_DEPTH,
}

function tabularSeriesPattern(prov: {
  pattern: string
  seriesPattern?: TabularPatternId
}): TabularPatternId {
  return (
    prov.seriesPattern ??
    (prov.pattern as TabularPatternId) ??
    DEFAULT_UNIFIED_DATA.pattern
  )
}

export function unifiedParamsFromHeatmap(heatmapSpec: HeatmapChartSpec): UnifiedDataParams {
  const tab = heatmapSpec.data
  if (tab.shape !== 'tabular' || !tab.provenance) {
    return { ...DEFAULT_UNIFIED_DATA }
  }
  const prov = tab.provenance
  const params = prov.params ?? {}
  return {
    pattern: (prov.pattern as TabularPatternId) ?? DEFAULT_UNIFIED_DATA.pattern,
    seriesPattern: tabularSeriesPattern(prov),
    seed: prov.seed ?? DEFAULT_UNIFIED_DATA.seed,
    categoryCount: params.categoryCount ?? DEFAULT_UNIFIED_DATA.categoryCount,
    seriesCount: params.seriesCount ?? DEFAULT_UNIFIED_DATA.seriesCount,
    maxDepth: params.maxDepth ?? DEFAULT_UNIFIED_DATA.maxDepth,
  }
}

export function unifiedParamsFromSpecs(
  specsByVariant: Record<ChartVariant, BarChartSpec>,
): UnifiedDataParams {
  const tab = specsByVariant.breakdown.data
  const tree = specsByVariant.hierarchy.data
  const prov =
    tab.shape === 'tabular' && tab.provenance
      ? tab.provenance
      : tree.shape === 'tree' && tree.provenance
        ? tree.provenance
        : null
  const params = prov?.params ?? {}
  return {
    pattern: (prov?.pattern as TabularPatternId) ?? DEFAULT_UNIFIED_DATA.pattern,
    seriesPattern: prov ? tabularSeriesPattern(prov) : DEFAULT_UNIFIED_DATA.seriesPattern,
    seed: prov?.seed ?? DEFAULT_UNIFIED_DATA.seed,
    categoryCount: params.categoryCount ?? DEFAULT_UNIFIED_DATA.categoryCount,
    seriesCount: params.seriesCount ?? DEFAULT_UNIFIED_DATA.seriesCount,
    maxDepth: params.maxDepth ?? DEFAULT_UNIFIED_DATA.maxDepth,
  }
}

function compositionGridFromBreakdown(breakdown: TabularData): TabularData['composition'] {
  return {
    categories: [...breakdown.categories],
    series: breakdown.series.map((s) => ({
      id: s.id,
      name: s.name,
      values: [...s.values],
    })),
  }
}

function tabularFromComposition(
  grid: NonNullable<TabularData['composition']>,
  provenance: TabularData['provenance'],
): TabularData {
  return {
    shape: 'tabular',
    categories: grid.categories,
    series: grid.series.map((s) => ({
      id: s.id,
      name: s.name,
      values: [...s.values],
    })),
    provenance,
  }
}

/** Tabular matrix for cartesian layout (stacked classic uses parent/child composition grid). */
export function resolveCartesianTabularData(spec: BarChartSpec): TabularData {
  const data = spec.data
  if (data.shape !== 'tabular') {
    throw new Error('Cartesian layout requires tabular data')
  }
  if (
    spec.layout.mode === 'cartesian' &&
    spec.layout.barLayout === 'stacked' &&
    data.composition
  ) {
    return tabularFromComposition(data.composition, data.provenance)
  }
  if (
    spec.layout.mode === 'cartesian' &&
    spec.layout.barLayout === 'stacked' &&
    data.categories.length === 1 &&
    data.provenance
  ) {
    const { pattern, seed, params } = data.provenance
    const categoryCount = params.categoryCount ?? data.series.length
    const seriesCount = params.seriesCount ?? DEFAULT_UNIFIED_DATA.seriesCount
    if (categoryCount >= 1 && seriesCount >= 1) {
      return generateTabularData(
        pattern as TabularPatternId,
        seed,
        { categoryCount, seriesCount },
        tabularSeriesPattern(data.provenance),
      )
    }
  }
  return data
}

/** Classic chart: one horizontal bar per species; each bar is its own series row. */
export function classicTabularFromBreakdown(breakdown: TabularData): TabularData {
  const prov = breakdown.provenance
  const composition = compositionGridFromBreakdown(breakdown)
  const series = breakdown.categories.map((name, ci) => {
    const valuesAcrossSeries = breakdown.series.map((s) => s.values[ci] ?? 0)
    const value = valuesAcrossSeries.reduce((a, b) => a + b, 0)
    return {
      id: `classic-s-${ci}`,
      name,
      values: [value],
    }
  })
  return {
    shape: 'tabular',
    categories: ['Share'],
    series,
    composition,
    provenance: prov
      ? {
          ...prov,
          params: {
            ...prov.params,
            categoryCount: breakdown.categories.length,
          },
        }
      : null,
  }
}

export function treeDataFromTabular(
  tabular: ReturnType<typeof generateTabularData>,
  params: UnifiedDataParams,
): TreeData {
  const { categories, series } = tabular
  const children: DataNode[] = categories.map((label, ci) => {
    const seriesLeaves: DataNode[] = series.map((s, si) => {
      const val = s.values[ci] ?? 0
      const node: DataNode = {
        id: `c${ci}-s${si}`,
        label: s.name,
        value: val,
      }
      if (params.maxDepth >= 3) {
        const popCount = Math.min(3, LOCAL_POPULATION_NAMES.length)
        const slice = val / popCount
        node.children = Array.from({ length: popCount }, (_, ki) => ({
          id: `c${ci}-s${si}-pop${ki}`,
          label: LOCAL_POPULATION_NAMES[ki]!,
          value: slice,
        }))
      }
      return node
    })
    const avg =
      seriesLeaves.reduce((sum, n) => sum + n.value, 0) / (seriesLeaves.length || 1)
    if (params.maxDepth <= 1) {
      return { id: `c${ci}`, label, value: avg }
    }
    return { id: `c${ci}`, label, value: avg, children: seriesLeaves }
  })

  const rootValue = children.reduce((sum, n) => sum + n.value, 0) || 1

  return {
    shape: 'tree',
    root: {
      id: 'virtual-root',
      label: 'All',
      value: rootValue,
      children,
    },
    defaultExpandedDepth: 1,
    provenance: {
      pattern: params.pattern,
      seriesPattern: params.seriesPattern,
      seed: params.seed,
      params: {
        categoryCount: params.categoryCount,
        seriesCount: params.seriesCount,
        maxDepth: params.maxDepth,
      },
    },
  }
}

export function applyUnifiedDataToHeatmap(
  heatmapSpec: HeatmapChartSpec,
  params: UnifiedDataParams,
) {
  heatmapSpec.data = generateTabularData(
    params.pattern,
    params.seed,
    {
      categoryCount: params.categoryCount,
      seriesCount: params.seriesCount,
    },
    params.seriesPattern,
  )
}

export function applyUnifiedDataToBundle(
  specsByVariant: Record<ChartVariant, BarChartSpec>,
  params: UnifiedDataParams,
) {
  const barParams = barUnifiedParams(params)
  const breakdownTabular = generateTabularData(
    barParams.pattern,
    barParams.seed,
    {
      categoryCount: barParams.categoryCount,
      seriesCount: barParams.seriesCount,
    },
    barParams.seriesPattern,
  )
  const prevHierarchy = specsByVariant.hierarchy.data
  const prevExpandedDepth =
    prevHierarchy.shape === 'tree' ? prevHierarchy.defaultExpandedDepth : 1

  specsByVariant.breakdown.data = breakdownTabular
  specsByVariant.classic.data = classicTabularFromBreakdown(breakdownTabular)
  const tree = treeDataFromTabular(breakdownTabular, barParams)
  tree.defaultExpandedDepth = prevExpandedDepth
  specsByVariant.hierarchy.data = tree
}
