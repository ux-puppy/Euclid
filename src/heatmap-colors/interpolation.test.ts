import { describe, expect, it } from 'vitest'
import { DEFAULT_INTERPOLATION } from './defaults'
import { mapScaleT } from './interpolation'
import { normalizeGradientStops } from './gradientStops'
import { sampleGradientAt } from './resolve'

describe('heatmap interpolation', () => {
  it('mapScaleT is identity for linear', () => {
    expect(mapScaleT(0.5, { ...DEFAULT_INTERPOLATION, scale: 'linear' })).toBeCloseTo(0.5)
  })

  it('mapScaleT differs from linear for log', () => {
    const cfg = { ...DEFAULT_INTERPOLATION, scale: 'log' as const, scaleLogBase: 10 }
    expect(mapScaleT(0.25, cfg)).not.toBeCloseTo(0.25)
  })

  it('quantization applies after log scale', () => {
    const cfg = {
      ...DEFAULT_INTERPOLATION,
      scale: 'log' as const,
      scaleLogBase: 10,
      scaleQuantized: true,
      scaleSteps: 4,
    }
    const curved = mapScaleT(0.25, { ...cfg, scaleQuantized: false })
    const curvedQuantized = mapScaleT(0.25, cfg)
    expect(curvedQuantized).not.toBeCloseTo(curved)
    expect(mapScaleT(0.26, cfg)).toBeCloseTo(curvedQuantized)
  })

  it('samples gradient at positioned stops', () => {
    const g = {
      stops: normalizeGradientStops([
        { position: 0, color: '#000000' },
        { position: 0.75, color: '#ffffff' },
        { position: 1, color: '#ff0000' },
      ]),
    }
    expect(sampleGradientAt(g, 0, 'oklch')).toBe('#000000')
    expect(sampleGradientAt(g, 1, 'oklch')).toBe('#ff0000')
  })

  it('oklch and srgb differ mid-gradient between saturated stops', () => {
    const g = {
      stops: normalizeGradientStops([
        { position: 0, color: '#0000ff' },
        { position: 1, color: '#ffff00' },
      ]),
    }
    const ok = sampleGradientAt(g, 0.5, 'oklch')
    const rgb = sampleGradientAt(g, 0.5, 'srgb')
    expect(ok).not.toBe(rgb)
  })
})
