import { describe, expect, it } from 'vitest'
import { mirrorGradient, normalizeGradientStops } from './gradientStops'

describe('mirrorGradient', () => {
  it('swaps endpoint colors', () => {
    const gradient = {
      stops: normalizeGradientStops([
        { position: 0, color: '#ff0000' },
        { position: 1, color: '#0000ff' },
      ]),
    }
    const mirrored = mirrorGradient(gradient)
    expect(mirrored.stops[0]!.color).toBe('#0000ff')
    expect(mirrored.stops[mirrored.stops.length - 1]!.color).toBe('#ff0000')
  })

  it('keeps mid stop color at mirrored position', () => {
    const gradient = {
      stops: normalizeGradientStops([
        { position: 0, color: '#111111' },
        { position: 0.5, color: '#00ff00' },
        { position: 1, color: '#222222' },
      ]),
    }
    const mirrored = mirrorGradient(gradient)
    const mid = mirrored.stops.find((s) => Math.abs(s.position - 0.5) < 1e-6)
    expect(mid?.color).toBe('#00ff00')
    expect(mirrored.stops[0]!.color).toBe('#222222')
    expect(mirrored.stops[mirrored.stops.length - 1]!.color).toBe('#111111')
  })
})
