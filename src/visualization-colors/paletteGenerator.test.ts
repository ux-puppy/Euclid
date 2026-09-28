import { describe, expect, it } from 'vitest'
import { DEFAULT_VISUALIZATION_PALETTE } from './defaults'
import {
  generateBaseColors,
  generateTemplateHues,
  hueForPaletteIndex,
} from './paletteGenerator'
import { oklchToHex } from './oklch'

describe('paletteGenerator', () => {
  it('selects different hue sets for N=3 vs N=6', () => {
    const l = 0.72
    const c = 0.12
    const w = { lightness: 1, chroma: 1, hue: 1 }
    const h3 = generateTemplateHues(3, l, c, w)
    const h6 = generateTemplateHues(6, l, c, w)
    expect(h3).toHaveLength(3)
    expect(h6).toHaveLength(6)
    expect(h3[0]).toBe(h6[0])
    expect(new Set(h6).size).toBe(6)
  })

  it('rotates palette when startHue changes', () => {
    const cfgA = { ...DEFAULT_VISUALIZATION_PALETTE, startHue: 0 }
    const cfgB = { ...DEFAULT_VISUALIZATION_PALETTE, startHue: 90 }
    const a = generateBaseColors(cfgA, 4).map((b) => b.hue)
    const b = generateBaseColors(cfgB, 4).map((h) => h.hue)
    for (let i = 0; i < 4; i++) {
      const delta = ((b[i]! - a[i]! + 360) % 360)
      expect(Math.abs(delta - 90)).toBeLessThan(1)
    }
  })

  it('uses shifted set for index 12+', () => {
    const h12 = hueForPaletteIndex(12, DEFAULT_VISUALIZATION_PALETTE)
    const h0 = hueForPaletteIndex(0, DEFAULT_VISUALIZATION_PALETTE)
    expect(Math.abs(h12 - h0)).toBeGreaterThan(1)
  })

  it('produces valid hex for high chroma', () => {
    const hex = oklchToHex(0.65, 0.35, 120)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
