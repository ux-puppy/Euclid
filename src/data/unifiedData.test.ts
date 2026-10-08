import { describe, expect, it } from 'vitest'
import { createHeatmapSpec, createInitialSpecsBundle } from '../chart-spec/defaults'
import {
  applyUnifiedDataToBundle,
  applyUnifiedDataToHeatmap,
  DEFAULT_UNIFIED_DATA,
  treeDataFromTabular,
  unifiedParamsFromHeatmap,
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

  it('classic uses one bar per species (series row); breakdown uses full series count', () => {
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, DEFAULT_UNIFIED_DATA)

    if (bundle.classic.data.shape !== 'tabular' || bundle.breakdown.data.shape !== 'tabular') {
      throw new Error('expected tabular data')
    }
    expect(bundle.classic.data.series.length).toBe(DEFAULT_UNIFIED_DATA.categoryCount)
    expect(bundle.classic.data.categories).toEqual(['Share'])
    expect(bundle.classic.data.series.map((s) => s.name)).toEqual(bundle.breakdown.data.categories)
    expect(bundle.breakdown.data.series.length).toBe(DEFAULT_UNIFIED_DATA.seriesCount)
    expect(bundle.classic.data.composition?.categories).toEqual(
      bundle.breakdown.data.categories,
    )
    expect(bundle.classic.data.composition?.series.map((s) => s.name)).toEqual(
      bundle.breakdown.data.series.map((s) => s.name),
    )
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

  it('applyUnifiedDataToHeatmap uses 0–100 or −100–100 value ranges', () => {
    const heatmap = createHeatmapSpec()
    applyUnifiedDataToHeatmap(heatmap, { ...DEFAULT_UNIFIED_DATA, pattern: 'random', seed: 1 })
    const flat = heatmap.data.series.flatMap((s) => s.values)
    expect(Math.min(...flat)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...flat)).toBeLessThanOrEqual(100)

    applyUnifiedDataToHeatmap(heatmap, {
      ...DEFAULT_UNIFIED_DATA,
      pattern: 'positive-negative',
      seed: 99,
    })
    const signed = heatmap.data.series.flatMap((s) => s.values)
    expect(signed.some((v) => v < 0)).toBe(true)
    expect(signed.some((v) => v > 0)).toBe(true)
    for (const v of signed) {
      expect(v).toBeGreaterThanOrEqual(-100)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('unifiedParamsFromSpecs reads breakdown provenance', () => {
    const bundle = createInitialSpecsBundle()
    applyUnifiedDataToBundle(bundle, { ...DEFAULT_UNIFIED_DATA, pattern: 'bell-curve', seed: 3 })
    const params = unifiedParamsFromSpecs(bundle)
    expect(params.pattern).toBe('bell-curve')
    expect(params.seed).toBe(3)
  })

  it('bar and heatmap data params are independent', () => {
    const bundle = createInitialSpecsBundle()
    const heatmap = createHeatmapSpec()
    applyUnifiedDataToBundle(bundle, { ...DEFAULT_UNIFIED_DATA, pattern: 'bell-curve', seed: 11 })
    applyUnifiedDataToHeatmap(heatmap, { ...DEFAULT_UNIFIED_DATA, pattern: 'random', seed: 22 })

    expect(unifiedParamsFromSpecs(bundle).pattern).toBe('bell-curve')
    expect(unifiedParamsFromSpecs(bundle).seed).toBe(11)
    expect(unifiedParamsFromHeatmap(heatmap).pattern).toBe('random')
    expect(unifiedParamsFromHeatmap(heatmap).seed).toBe(22)
  })
})
