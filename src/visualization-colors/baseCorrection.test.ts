import { describe, expect, it } from 'vitest'
import {
  BASE_CHROMA_TARGET,
  BASE_CHROMA_UNCORRECTED,
  BASE_LIGHTNESS_TARGET,
  BASE_LIGHTNESS_UNCORRECTED,
  migrateBaseCorrection,
  resolveBaseLc,
} from './baseCorrection'

describe('baseCorrection', () => {
  it('uses uncorrected L/C at 0', () => {
    const lc = resolveBaseLc({ lightnessCorrection: 0, chromaCorrection: 0 })
    expect(lc.lightness).toBeCloseTo(BASE_LIGHTNESS_UNCORRECTED)
    expect(lc.chroma).toBeCloseTo(BASE_CHROMA_UNCORRECTED)
  })

  it('uses target L/C at 1', () => {
    const lc = resolveBaseLc({ lightnessCorrection: 1, chromaCorrection: 1 })
    expect(lc.lightness).toBeCloseTo(BASE_LIGHTNESS_TARGET)
    expect(lc.chroma).toBeCloseTo(BASE_CHROMA_TARGET)
  })

  it('migrates legacy base lightness/chroma', () => {
    const m = migrateBaseCorrection({ lightness: 0.72, chroma: 0.12 })
    expect(m.lightnessCorrection).toBeCloseTo(1)
    expect(m.chromaCorrection).toBeCloseTo(1)
  })
})
