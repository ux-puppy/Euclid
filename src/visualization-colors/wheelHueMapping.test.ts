import { describe, expect, it } from 'vitest'
import { generateBaseColors } from './paletteGenerator'
import { DEFAULT_VISUALIZATION_PALETTE } from './defaults'
import {
  evenWheelTemplateHues,
  wheelHandleAngleDegFromHue,
} from './wheelHueMapping'

describe('evenlySpacedTemplateHuesOnWheel', () => {
  it('steps handle angle by 360/n so labels follow 1…n on the iro wheel', () => {
    const cfg = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      startHue: 0,
      hueLayout: 'even' as const,
      excessColorHandling: {
        ...DEFAULT_VISUALIZATION_PALETTE.excessColorHandling!,
        enabled: false,
      },
    }
    const n = 8
    const hues = generateBaseColors(cfg, n).map((b) => b.hue)
    const angles = hues.map((h) => wheelHandleAngleDegFromHue(h))
    for (let i = 1; i < n; i++) {
      const step = normalizeStep(angles[i]! - angles[i - 1]!)
      expect(step).toBeCloseTo(360 / n, 5)
    }
  })

  it('anchors slot 0 at startHue', () => {
    const offsets = evenWheelTemplateHues(5, 42, 1)
    expect(offsets[0]).toBeCloseTo(0, 5)
    const hues = offsets.map((o) => (o + 42 + 360) % 360)
    expect(hues[0]).toBeCloseTo(42, 5)
  })

  it('widens the wrap gap between last color and 1 when separation is reduced', () => {
    const n = 8
    const startHue = 0
    const full = evenWheelTemplateHues(n, startHue, 1).map(
      (o) => wheelHandleAngleDegFromHue((o + startHue + 360) % 360),
    )
    const tight = evenWheelTemplateHues(n, startHue, 0.25).map(
      (o) => wheelHandleAngleDegFromHue((o + startHue + 360) % 360),
    )
    const step = 360 / n
    const wrapFull = normalizeStep(full[0]! - full[n - 1]!)
    const wrapTight = normalizeStep(tight[0]! - tight[n - 1]!)
    expect(wrapFull).toBeCloseTo(step, 5)
    expect(wrapTight).toBeGreaterThan(wrapFull)
    for (let i = 1; i < n; i++) {
      const gap = normalizeStep(tight[i]! - tight[i - 1]!)
      expect(gap).toBeLessThan(step)
    }
  })
})

function normalizeStep(delta: number): number {
  const d = ((delta % 360) + 360) % 360
  return d === 0 ? 360 : d
}
