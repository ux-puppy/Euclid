import { describe, expect, it } from 'vitest'
import { DEFAULT_VISUALIZATION_PALETTE } from './defaults'
import { perceptualHexFromHue, standardHexFromHue, themedHexFromHue } from './perceptionColor'

describe('perceptionColor', () => {
  it('uses HSL at 0% perception correction', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      base: { lightnessCorrection: 0, chromaCorrection: 0 },
    }
    const expected = standardHexFromHue(120, cfg.lightMode.lightness, cfg.lightMode.chroma)
    expect(themedHexFromHue(120, cfg, 'light')).toBe(expected)
  })

  it('uses OKLCH gamut mapping at 100% perception correction', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      base: { lightnessCorrection: 1, chromaCorrection: 1 },
    }
    const expected = perceptualHexFromHue(120, cfg.lightMode.lightness, cfg.lightMode.chroma)
    expect(themedHexFromHue(120, cfg, 'light')).toBe(expected)
  })

  it('differs between 0% and 100% for saturated theme chroma', () => {
    const base = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      lightMode: { lightness: 0.65, chroma: 0.22 },
    }
    const std = themedHexFromHue(45, { ...base, base: { lightnessCorrection: 0, chromaCorrection: 0 } }, 'light')
    const perc = themedHexFromHue(45, { ...base, base: { lightnessCorrection: 1, chromaCorrection: 1 } }, 'light')
    expect(std).not.toBe(perc)
  })
})
