import type {
  ChartSpec,
  ChartVariant,
  DataNode,
  TabularData,
  TabularPatternId,
  TreeData,
} from '../chart-spec/types'
import { DEFAULT_TREE_MAX_DEPTH } from '../chart-spec/constants'
import { generateTabularData } from './generate'
import { CITY_NAMES } from './patterns/geoLabels'

export type UnifiedDataParams = {
  pattern: TabularPatternId
  seed: number
  categoryCount: number
  seriesCount: number
  maxDepth: number
}

export const DEFAULT_UNIFIED_DATA: UnifiedDataParams = {
  pattern: 'random',
  seed: 42,
  categoryCount: 6,
  seriesCount: 5,
  maxDepth: DEFAULT_TREE_MAX_DEPTH,
}

export function unifiedParamsFromSpecs(
  specsByVariant: Record<ChartVariant, ChartSpec>,
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
    seed: prov?.seed ?? DEFAULT_UNIFIED_DATA.seed,
    categoryCount: params.categoryCount ?? DEFAULT_UNIFIED_DATA.categoryCount,
    seriesCount: params.seriesCount ?? DEFAULT_UNIFIED_DATA.seriesCount,
    maxDepth: params.maxDepth ?? DEFAULT_UNIFIED_DATA.maxDepth,
  }
}

/** Classic chart: one horizontal bar per country; each bar is its own series row. */
export function classicTabularFromBreakdown(breakdown: TabularData): TabularData {
  const prov = breakdown.provenance
  const series = breakdown.categories.map((name, ci) => {
    const valuesAcrossSeries = breakdown.series.map((s) => s.values[ci] ?? 0)
    const value =
      valuesAcrossSeries.reduce((a, b) => a + b, 0) / (valuesAcrossSeries.length || 1)
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
    provenance: prov
      ? {
          ...prov,
          params: {
            ...prov.params,
            categoryCount: breakdown.categories.length,
            seriesCount: 1,
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
        const cityCount = Math.min(3, CITY_NAMES.length)
        const slice = val / cityCount
        node.children = Array.from({ length: cityCount }, (_, ki) => ({
          id: `c${ci}-s${si}-city${ki}`,
          label: CITY_NAMES[ki]!,
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
    root: { id: 'root', label: 'All', value: rootValue, children },
    defaultExpandedDepth: 1,
    provenance: {
      pattern: params.pattern,
      seed: params.seed,
      params: {
        categoryCount: params.categoryCount,
        seriesCount: params.seriesCount,
        maxDepth: params.maxDepth,
      },
    },
  }
}

export function applyUnifiedDataToBundle(
  specsByVariant: Record<ChartVariant, ChartSpec>,
  params: UnifiedDataParams,
) {
  const breakdownTabular = generateTabularData(params.pattern, params.seed, {
    categoryCount: params.categoryCount,
    seriesCount: params.seriesCount,
  })
  const prevHierarchy = specsByVariant.hierarchy.data
  const prevExpandedDepth =
    prevHierarchy.shape === 'tree' ? prevHierarchy.defaultExpandedDepth : 1

  specsByVariant.breakdown.data = breakdownTabular
  specsByVariant.classic.data = classicTabularFromBreakdown(breakdownTabular)
  const tree = treeDataFromTabular(breakdownTabular, params)
  tree.defaultExpandedDepth = prevExpandedDepth
  specsByVariant.hierarchy.data = tree
}
