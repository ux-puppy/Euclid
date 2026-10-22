import { describe, expect, it } from 'vitest'
import { normalizeHeatmapColors } from './defaults'
import { readColorAlpha } from './colorAlpha'
import { canonicalHeatmapHex, transformHeatmapHex } from './themeAdapt'
import { sampleGradientAt } from './resolve'

describe('heatmap color alpha', () => {
  it('reads alpha from 8-digit hex', () => {
    expect(readColorAlpha('#ff000080')).toBeCloseTo(0.5, 2)
  })

  it('preserves alpha through theme transform at default sliders', () => {
    const config = normalizeHeatmapColors(undefined)
    const input = '#33669980'
    const out = transformHeatmapHex(input, config, 'light')
    expect(readColorAlpha(out)).toBeCloseTo(0.5, 2)
  })

  it('round-trips alpha through canonical in dark theme', () => {
    const config = normalizeHeatmapColors(undefined)
    const stored = '#4488cc66'
    const display = transformHeatmapHex(stored, config, 'dark')
    const back = canonicalHeatmapHex(display, config, 'dark')
    expect(readColorAlpha(back)).toBeCloseTo(readColorAlpha(stored), 2)
  })

  it('interpolates alpha between gradient stops', () => {
    const gradient = {
      stops: [
        { position: 0, color: '#00000000' },
        { position: 1, color: '#000000ff' },
      ],
    }
    const mid = sampleGradientAt(gradient, 0.5, 'oklch', true)
    expect(readColorAlpha(mid)).toBeCloseTo(0.5, 1)
  })

  it('ignores alpha at output when useStopAlpha is off', () => {
    const config = normalizeHeatmapColors({ useStopAlpha: false })
    const gradient = {
      stops: [
        { position: 0, color: '#ff000000' },
        { position: 1, color: '#ff0000ff' },
      ],
    }
    const mid = sampleGradientAt(gradient, 0.5, 'oklch', config.useStopAlpha)
    expect(readColorAlpha(mid)).toBeCloseTo(1, 2)
  })
})
