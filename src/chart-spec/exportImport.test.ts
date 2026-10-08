import { describe, expect, it } from 'vitest'
import { createHeatmapSpec, createInitialSpecsBundle } from './defaults'
import {
  bundleForExport,
  isSpecsBundleExportV3,
  parseImportedPayload,
} from './exportImport'

describe('exportImport bundle v3', () => {
  it('round-trips all chart variants including heatmap', () => {
    const bundle = createInitialSpecsBundle()
    const heatmap = createHeatmapSpec()
    const exported = bundleForExport('breakdown', bundle, heatmap, [])
    const json = JSON.stringify(exported)
    expect(isSpecsBundleExportV3(JSON.parse(json))).toBe(true)

    const parsed = parseImportedPayload(json)
    expect(parsed.kind).toBe('bundle-v3')
    if (parsed.kind !== 'bundle-v3') return
    expect(parsed.bundle.selectedChart).toBe('breakdown')
    expect(parsed.bundle.specsByVariant.hierarchy.data.shape).toBe('tree')
    expect(parsed.bundle.heatmapSpec.chartType).toBe('heatmap')
  })

  it('still imports legacy single-spec JSON', () => {
    const spec = createInitialSpecsBundle().classic
    const parsed = parseImportedPayload(JSON.stringify(spec))
    expect(parsed.kind).toBe('single')
  })
})
