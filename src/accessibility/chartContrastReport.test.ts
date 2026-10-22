import { describe, expect, it } from 'vitest'
import { createInitialSpecsBundle } from '../chart-spec/defaults'
import { buildNudgedPaletteFills } from '../visualization-colors/accessibilityNudge'
import { DEFAULT_VISUALIZATION_PALETTE } from '../visualization-colors/defaults'
import { paletteAccessibilitySlots } from './chartContrastReport'

describe('paletteAccessibilitySlots with baked nudge', () => {
  it('passes all slots when nudged fills are applied explicitly', () => {
    const spec = createInitialSpecsBundle().classic
    const thresholds = {
      minRatioOnBackground: 4.5,
      minRatioOnBarText: 4.5,
    }
    const baseConfig = {
      ...DEFAULT_VISUALIZATION_PALETTE,
      lightMode: { lightness: 0.92, chroma: 0.04 },
      accessibility: thresholds,
    }

    const withoutNudge = paletteAccessibilitySlots(spec, baseConfig, 'light', 6)
    expect(withoutNudge.some((s) => !s.passOnBackground || !s.passOnBarText)).toBe(true)

    const nudgedFills = buildNudgedPaletteFills(baseConfig, spec, 'light', 6)
    const withNudge = paletteAccessibilitySlots(
      spec,
      { ...baseConfig, accessibility: { ...thresholds, nudgedFills } },
      'light',
      6,
    )
    for (const slot of withNudge) {
      if (slot.fill === 'transparent') continue
      expect(slot.passOnBackground).toBe(true)
      expect(slot.passOnBarText).toBe(true)
    }
  })
})
