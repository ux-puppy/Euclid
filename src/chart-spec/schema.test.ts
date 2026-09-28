import { describe, expect, it } from 'vitest'
import { createClassicSpec } from './defaults'
import { migrateChartSpec } from './schema'

describe('chart spec schema', () => {
  it('round-trips classic spec through JSON', () => {
    const spec = createClassicSpec()
    const parsed = migrateChartSpec(JSON.parse(JSON.stringify(spec)))
    expect(parsed.variant).toBe('classic')
    expect(parsed.data.shape).toBe('tabular')
    expect(parsed.schemaVersion).toBe(2)
    expect(parsed.colors.visualization.startHue).toBeGreaterThanOrEqual(0)
  })

  it('migrates v1 specs with series arrays', () => {
    const v1 = createClassicSpec()
    const legacy = {
      ...v1,
      schemaVersion: 1 as const,
      colors: {
        background: '#1a1a1a',
        text: 'rgba(255,255,255,0.9)',
        textSecondary: 'rgba(255,255,255,0.5)',
        axis: 'rgba(255,255,255,0.4)',
        grid: 'rgba(255,255,255,0.08)',
        series: ['#b8a9e8', '#f4a896'],
        depth: ['#6b5b95', '#9b8fc4'],
        hover: 'rgba(255,255,255,0.15)',
        selected: 'rgba(255,255,255,0.25)',
        tooltip: '#2a2a2a',
        border: 'rgba(255,255,255,0.12)',
      },
    }
    const parsed = migrateChartSpec(JSON.parse(JSON.stringify(legacy)))
    expect(parsed.schemaVersion).toBe(2)
    expect(parsed.colors.surfaceByTheme.dark.background).toBe('#1a1a1a')
    expect(parsed.colors.visualization).toBeDefined()
  })
})
