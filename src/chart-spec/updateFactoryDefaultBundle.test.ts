import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildProgrammaticFactoryExport } from './defaults'

const here = dirname(fileURLToPath(import.meta.url))
const factoryPath = join(here, 'factoryDefaultBundle.json')

describe('factoryDefaultBundle.json', () => {
  it('matches programmatic export when UPDATE_FACTORY_DEFAULTS=1', () => {
    if (process.env.UPDATE_FACTORY_DEFAULTS !== '1') return

    const bundle = buildProgrammaticFactoryExport()
    const payload = {
      bundle,
      editor: {
        selectedChart: 'palette',
        theme: 'dark',
        inspectorTab: 'colors',
        paletteReturnChart: bundle.selectedChart,
      },
    }
    writeFileSync(factoryPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    expect(true).toBe(true)
  })

  it('bakes from BAKE_DEFAULTS_PATH export file', async () => {
    const bakePath = process.env.BAKE_DEFAULTS_PATH
    if (!bakePath) return

    const { parseFactoryDefaultFile } = await import('./factoryDefaults')
    const text = readFileSync(bakePath, 'utf8')
    const file = parseFactoryDefaultFile(text)
    writeFileSync(factoryPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
    expect(true).toBe(true)
  })

  it('loads committed factory defaults', async () => {
    const { loadFactoryDefaults } = await import('./factoryDefaults')
    const file = loadFactoryDefaults()
    expect(file.bundle.version).toBe(3)
    expect(file.bundle.specsByVariant.classic.chartType).toBe('bar')
    expect(file.bundle.heatmapSpec.chartType).toBe('heatmap')
  })
})
