import { describe, expect, it } from 'vitest'
import { createHeatmapSpec, createInitialSpecsBundle } from './defaults'
import { buildPaletteCatalog } from './paletteCatalog'

describe('buildPaletteCatalog', () => {
  it('includes surface, series, depth, and heatmap sections with light/dark hex', () => {
    const specsByVariant = createInitialSpecsBundle()
    const heatmapSpec = createHeatmapSpec()
    const catalog = buildPaletteCatalog({ specsByVariant, heatmapSpec })

    const ids = catalog.sections.map((s) => s.id)
    expect(ids).toContain('surface')
    expect(ids).toContain('viz')
    expect(
      catalog.sections.find((s) => s.id === 'viz')?.entries[0]?.token,
    ).toBe('viz.color.1')
    expect(ids).toContain('depth')
    expect(ids.some((id) => id.startsWith('heatmap'))).toBe(true)

    const background = catalog.sections
      .find((s) => s.id === 'surface')
      ?.entries.find((e) => e.token === 'surface.background')
    expect(background?.light).toMatch(/^#/)
    expect(background?.dark).toMatch(/^#/)

    const hexDisplay = /^#[0-9A-F]{6}([0-9A-F]{2})?$/

    for (const section of catalog.sections) {
      for (const entry of section.entries) {
        expect(entry.token.length).toBeGreaterThan(0)
        expect(entry.light).toMatch(hexDisplay)
        expect(entry.dark).toMatch(hexDisplay)
      }
    }
  })
})
