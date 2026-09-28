import { describe, expect, it } from 'vitest'
import { darkChartColors } from '../chart-spec/colorPresets'
import { migrateVisualizationFromLegacy } from './migrateFromLegacy'

describe('migrateFromLegacy', () => {
  it('infers startHue from legacy series', () => {
    const viz = migrateVisualizationFromLegacy(darkChartColors)
    expect(viz.startHue).toBeGreaterThanOrEqual(0)
    expect(viz.startHue).toBeLessThan(360)
  })
})
