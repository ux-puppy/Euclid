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
    const fullPerception = { lightnessCorrection: 1, chromaCorrection: 1 }
    const h3 = generateTemplateHues(3, l, c, w, fullPerception, 'greedy')
    const h6 = generateTemplateHues(6, l, c, w, fullPerception, 'greedy')
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

  it('uses shifted set for index at activateAfter+', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      excessColorHandling: {
        ...DEFAULT_VISUALIZATION_PALETTE.excessColorHandling!,
        enabled: true,
        activateAfter: 12,
        mode: 'repeatWithShift' as const,
        shiftDegrees: 15,
      },
    }
    const h12 = hueForPaletteIndex(12, cfg, 12)
    const h0 = hueForPaletteIndex(0, cfg, 12)
    expect(Math.abs(h12 - h0)).toBeGreaterThan(1)
  })

  it('rotates after custom set size', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      startHue: 0,
      excessColorHandling: {
        ...DEFAULT_VISUALIZATION_PALETTE.excessColorHandling!,
        enabled: true,
        activateAfter: 8,
        mode: 'repeatWithShift' as const,
        shiftDegrees: 22.5,
      },
    }
    const h8 = hueForPaletteIndex(8, cfg, 10)
    const h0 = hueForPaletteIndex(0, cfg, 10)
    expect(Math.abs(h8 - h0)).toBeGreaterThan(1)
  })

  it('does not wrap hues when excess handling is disabled', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      excessColorHandling: {
        ...DEFAULT_VISUALIZATION_PALETTE.excessColorHandling!,
        enabled: false,
      },
    }
    const hues = generateBaseColors(cfg, 6).map((b) => b.hue)
    expect(new Set(hues.map((h) => Math.round(h))).size).toBe(6)
  })

  it('keeps smart (greedy) ordering when excess handling is off', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      startHue: 0,
      hueLayout: 'greedy' as const,
      paletteRevision: 2,
      excessColorHandling: {
        ...DEFAULT_VISUALIZATION_PALETTE.excessColorHandling!,
        enabled: false,
      },
    }
    const hues = generateBaseColors(cfg, 3).map((b) => b.hue)
    expect(hues[0]).toBeCloseTo(0, 5)
    expect(hues[1]).toBeCloseTo(180, 5)
    expect(hues[2]).toBeCloseTo(90, 5)
  })

  it('uses even wheel steps when excess off and smart ordering off', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      startHue: 0,
      hueLayout: 'even' as const,
      excessColorHandling: {
        ...DEFAULT_VISUALIZATION_PALETTE.excessColorHandling!,
        enabled: false,
      },
    }
    const hues = generateBaseColors(cfg, 4).map((b) => b.hue)
    expect(hues[0]).toBeCloseTo(0, 5)
    expect(hues[1]).toBeCloseTo(270, 5)
    expect(hues[2]).toBeCloseTo(180, 5)
    expect(hues[3]).toBeCloseTo(90, 5)
  })

  it('spaces N hues evenly on the wheel by default for N ≤ 12', () => {
    const cfg = { ...DEFAULT_VISUALIZATION_PALETTE, startHue: 0 }
    const two = generateBaseColors(cfg, 2).map((b) => b.hue)
    expect(two[0]).toBeCloseTo(0, 5)
    expect(two[1]).toBeCloseTo(180, 5)
    const three = generateBaseColors(cfg, 3).map((b) => b.hue)
    expect(three[0]).toBeCloseTo(0, 5)
    expect(three[1]).toBeCloseTo(240, 5)
    expect(three[2]).toBeCloseTo(120, 5)
  })

  it('uses greedy order for three hues (third between first two)', () => {
    const cfg = { ...DEFAULT_VISUALIZATION_PALETTE, startHue: 0, hueLayout: 'greedy' as const }
    const hues = generateBaseColors(cfg, 3).map((b) => b.hue)
    expect(hues[0]).toBeCloseTo(0, 5)
    expect(hues[1]).toBeCloseTo(180, 5)
    expect(hues[2]).toBeCloseTo(90, 5)
  })

  it('changes template hues when hue separation weight changes', () => {
    const l = 0.72
    const c = 0.12
    const fullPerception = { lightnessCorrection: 1, chromaCorrection: 1 }
    const tight = generateTemplateHues(
      6,
      l,
      c,
      { lightness: 1, chroma: 1, hue: 0.25 },
      fullPerception,
      'greedy',
    )
    const wide = generateTemplateHues(
      6,
      l,
      c,
      { lightness: 1, chroma: 1, hue: 1 },
      fullPerception,
      'greedy',
    )
    expect(tight).not.toEqual(wide)
  })

  it('produces valid hex for high chroma', () => {
    const hex = oklchToHex(0.65, 0.35, 120)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
