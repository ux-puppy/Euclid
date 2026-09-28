import type { TabularData, TabularPatternId, TreeData, TreePatternId } from '../chart-spec/types'
import {
  generateCategories,
  generateSeriesNames,
  generateTabularValues,
} from './patterns/tabular'
import { generateTreeRoot } from './patterns/tree'

export function generateTabularData(
  pattern: TabularPatternId,
  seed: number,
  params: { categoryCount: number; seriesCount: number },
): TabularData {
  const categories = generateCategories(params.categoryCount, seed)
  const names = generateSeriesNames(params.seriesCount, seed)
  const matrix = generateTabularValues(
    pattern,
    seed,
    params.categoryCount,
    params.seriesCount,
  )
  return {
    shape: 'tabular',
    categories,
    series: names.map((name, i) => ({
      id: `s-${i}`,
      name,
      values: matrix[i]!,
    })),
    provenance: {
      pattern,
      seed,
      params: {
        categoryCount: params.categoryCount,
        seriesCount: params.seriesCount,
      },
    },
  }
}

export function generateTreeData(
  pattern: TreePatternId,
  seed: number,
  params: { maxDepth: number; branchMin: number; branchMax: number },
): TreeData {
  return {
    shape: 'tree',
    root: generateTreeRoot(pattern, seed, params),
    defaultExpandedDepth: 1,
    provenance: {
      pattern,
      seed,
      params: {
        maxDepth: params.maxDepth,
        branchMin: params.branchMin,
        branchMax: params.branchMax,
      },
    },
  }
}

export function randomizeSeed(): number {
  return Math.floor(Math.random() * 2147483647)
}
