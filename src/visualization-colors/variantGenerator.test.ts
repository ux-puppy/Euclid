import { describe, expect, it } from 'vitest'
import { DEFAULT_VISUALIZATION_PALETTE } from './defaults'
import { hierarchyLevelHex } from './variantGenerator'

describe('variantGenerator', () => {
  it('increases lightness for hierarchy levels when direction is lighter', () => {
    const l0 = hierarchyLevelHex(200, 0, DEFAULT_VISUALIZATION_PALETTE, 'dark')
    const l2 = hierarchyLevelHex(200, 2, DEFAULT_VISUALIZATION_PALETTE, 'dark')
    expect(l0).not.toBe(l2)
  })

  it('applies opacity together with OKLCH variation', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      variation: {
        ...DEFAULT_VISUALIZATION_PALETTE.variation,
        opacityStep: 0.15,
        opacityDirection: 'decrease' as const,
      },
    }
    const l0 = hierarchyLevelHex(200, 0, cfg, 'dark')
    const l2 = hierarchyLevelHex(200, 2, cfg, 'dark')
    expect(l0).not.toBe(l2)
    expect(l2).toMatch(/^#[0-9a-f]{8}$/i)
  })
})
