import { describe, expect, it } from 'vitest'
import { normalizeGradientStops } from './gradientStops'
import { blendDifferenceSamples, blendDifferenceSmoothCurve } from './blendCompare'

describe('blendCompare', () => {
  it('reports zero ΔE when endpoints match under both blends', () => {
    const gradient = {
      stops: normalizeGradientStops([
        { position: 0, color: '#000000' },
        { position: 1, color: '#000000' },
      ]),
    }
    const samples = blendDifferenceSamples(gradient, 8)
    expect(samples.every((p) => p.deltaE === 0)).toBe(true)
  })

  it('reports non-zero ΔE for saturated mid blend', () => {
    const gradient = {
      stops: normalizeGradientStops([
        { position: 0, color: '#0000ff' },
        { position: 1, color: '#ffff00' },
      ]),
    }
    const max = Math.max(...blendDifferenceSamples(gradient, 32).map((p) => p.deltaE))
    expect(max).toBeGreaterThan(0)
  })

  it('smooth curve has more display points than sparse samples', () => {
    const gradient = {
      stops: normalizeGradientStops([
        { position: 0, color: '#0000ff' },
        { position: 1, color: '#ffff00' },
      ]),
    }
    const smooth = blendDifferenceSmoothCurve(gradient, 8, 32)
    expect(smooth.length).toBe(32)
  })
})
