import { describe, expect, it } from 'vitest'
import { createInitialSpecsBundle } from './defaults'
import {
  bundleForExport,
  isSpecsBundleExportV2,
  parseImportedPayload,
} from './exportImport'

describe('exportImport bundle v2', () => {
  it('round-trips all chart variants', () => {
    const bundle = createInitialSpecsBundle()
    const exported = bundleForExport('breakdown', bundle, [])
    const json = JSON.stringify(exported)
    expect(isSpecsBundleExportV2(JSON.parse(json))).toBe(true)

    const parsed = parseImportedPayload(json)
    expect(parsed.kind).toBe('bundle')
    if (parsed.kind !== 'bundle') return
    expect(parsed.bundle.selectedVariant).toBe('breakdown')
    expect(parsed.bundle.specsByVariant.hierarchy.data.shape).toBe('tree')
  })

  it('still imports legacy single-spec JSON', () => {
    const spec = createInitialSpecsBundle().classic
    const parsed = parseImportedPayload(JSON.stringify(spec))
    expect(parsed.kind).toBe('single')
  })
})
