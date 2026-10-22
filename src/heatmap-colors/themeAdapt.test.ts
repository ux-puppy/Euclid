import { describe, expect, it } from 'vitest'
import { DEFAULT_HEATMAP_COLORS, normalizeHeatmapColors } from './defaults'
import {
  applyHeatmapTheme,
  canonicalHeatmapHex,
  transformHeatmapHex,
} from './themeAdapt'
import { oklchFromHex } from '../visualization-colors/oklch'

describe('heatmap themeAdapt', () => {
  const base = normalizeHeatmapColors({
    adaptInversion: false,
    lightMode: { lightness: 0.5, chroma: 0.1 },
    darkMode: { lightness: 0.7, chroma: 0.12 },
    sequential: {
      stops: [
        { position: 0, color: '#336699' },
        { position: 1, color: '#ff8844' },
      ],
    },
  })

  it('is identity at default light-mode slider values', () => {
    const defaults = normalizeHeatmapColors(undefined)
    expect(transformHeatmapHex('#336699', defaults, 'light')).toBe('#336699')
  })

  it('shifts lightness when light brightness slider moves', () => {
    const hex = '#336699'
    const okBefore = oklchFromHex(hex)!
    const brighter = normalizeHeatmapColors({
      lightMode: { lightness: 0.82, chroma: DEFAULT_HEATMAP_COLORS.lightMode.chroma },
    })
    const out = transformHeatmapHex(hex, brighter, 'light')
    const okAfter = oklchFromHex(out)!
    expect(okAfter.l).toBeGreaterThan(okBefore.l)
  })

  it('increases lightness in dark when darkMode is brighter than canonical', () => {
    const atDefaults = normalizeHeatmapColors({
      darkMode: { lightness: 0.85, chroma: 0.12 },
    })
    const dark = transformHeatmapHex('#336699', atDefaults, 'dark')
    const okCanon = oklchFromHex('#336699')
    const okDark = oklchFromHex(dark)
    expect(okCanon).toBeTruthy()
    expect(okDark).toBeTruthy()
    expect(okDark!.l).toBeGreaterThan(okCanon!.l)
  })

  it('applies different chroma when dark/light chroma sliders differ', () => {
    const hex = '#4488cc'
    const lowChromaDark = normalizeHeatmapColors({
      ...base,
      darkMode: { lightness: 0.7, chroma: 0.05 },
    })
    const highChromaDark = normalizeHeatmapColors({
      ...base,
      darkMode: { lightness: 0.7, chroma: 0.2 },
    })
    const a = transformHeatmapHex(hex, lowChromaDark, 'dark')
    const b = transformHeatmapHex(hex, highChromaDark, 'dark')
    expect(a).not.toBe(b)
  })

  it('round-trips canonical after forward transform', () => {
    const forward = transformHeatmapHex('#336699', base, 'dark')
    const back = canonicalHeatmapHex(forward, base, 'dark')
    const okA = oklchFromHex('#336699')
    const okB = oklchFromHex(back)
    expect(okA).toBeTruthy()
    expect(okB).toBeTruthy()
    expect(okB!.l).toBeCloseTo(okA!.l, 2)
    expect(okB!.c).toBeCloseTo(okA!.c, 2)
    expect(okB!.h).toBeCloseTo(okA!.h, 0)
  })

  it('adapt inversion keeps dark emphasis: darker canonical stop stays lighter than pale stop', () => {
    const config = normalizeHeatmapColors({
      adaptInversion: true,
      darkMode: { lightness: 0.6, chroma: 0.09 },
    })
    const intense = '#cc2222'
    const pale = '#f0e8e0'
    const okIntense = oklchFromHex(intense)!
    const okPale = oklchFromHex(pale)!
    expect(okIntense.l).toBeLessThan(okPale.l)

    const darkIntense = oklchFromHex(transformHeatmapHex(intense, config, 'dark'))!
    const darkPale = oklchFromHex(transformHeatmapHex(pale, config, 'dark'))!
    expect(darkIntense.l).toBeGreaterThan(darkPale.l)
  })

  it('adapt inversion off applies uniform lightness shift only', () => {
    const withInv = normalizeHeatmapColors({ adaptInversion: true })
    const noInv = normalizeHeatmapColors({ adaptInversion: false })
    const hex = '#cc2222'
    expect(transformHeatmapHex(hex, withInv, 'dark')).not.toBe(
      transformHeatmapHex(hex, noInv, 'dark'),
    )
  })

  it('round-trips lightness with adapt inversion enabled', () => {
    const config = normalizeHeatmapColors({ adaptInversion: true })
    const stored = '#4488cc'
    const forward = transformHeatmapHex(stored, config, 'dark')
    const back = canonicalHeatmapHex(forward, config, 'dark')
    const okA = oklchFromHex(stored)
    const okB = oklchFromHex(back)
    expect(okA).toBeTruthy()
    expect(okB).toBeTruthy()
    expect(okB!.l).toBeCloseTo(okA!.l, 2)
  })
})
