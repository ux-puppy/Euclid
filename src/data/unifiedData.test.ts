import { describe, expect, it } from 'vitest'
import { createInitialSpecsBundle } from '../chart-spec/defaults'
import {
  applyUnifiedDataToBundle,
  DEFAULT_UNIFIED_DATA,
  treeDataFromTabular,
  unifiedParamsFromSpecs,
} from './unifiedData'
import { generateTabularData } from './generate'

describe('unifiedData', () => {
  it('applyUnifiedDataToBundle keeps shared seed across variants', () => {
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, { ...DEFAULT_UNIFIED_DATA, seed: 99 })

    expect(bundle.classic.data.provenance?.seed).toBe(99)
    expect(bundle.breakdown.data.provenance?.seed).toBe(99)
    expect(bundle.hierarchy.data.provenance?.seed).toBe(99)
  })

  it('classic uses one bar per country (series row); breakdown uses full series count', () => {
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, DEFAULT_UNIFIED_DATA)

    if (bundle.classic.data.shape !== 'tabular' || bundle.breakdown.data.shape !== 'tabular') {
      throw new Error('expected tabular data')
    }
    expect(bundle.classic.data.series.length).toBe(DEFAULT_UNIFIED_DATA.categoryCount)
    expect(bundle.classic.data.categories).toEqual(['Share'])
    expect(bundle.classic.data.series.map((s) => s.name)).toEqual(bundle.breakdown.data.categories)
    expect(bundle.breakdown.data.series.length).toBe(DEFAULT_UNIFIED_DATA.seriesCount)
  })

  it('treeDataFromTabular mirrors breakdown categories', () => {
    const tabular = generateTabularData('random', 7, {
      categoryCount: 4,
      seriesCount: 3,
    })
    const tree = treeDataFromTabular(tabular, {
      ...DEFAULT_UNIFIED_DATA,
      categoryCount: 4,
      seriesCount: 3,
      maxDepth: 2,
    })
    expect(tree.root.children?.length).toBe(4)
    expect(tree.root.children?.[0]?.children?.length).toBe(3)
  })

  it('unifiedParamsFromSpecs reads breakdown provenance', () => {
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, { ...DEFAULT_UNIFIED_DATA, pattern: 'bell-curve', seed: 3 })
    const params = unifiedParamsFromSpecs(bundle)
    expect(params.pattern).toBe('bell-curve')
    expect(params.seed).toBe(3)
  })
})
