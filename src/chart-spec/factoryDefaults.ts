import { migrateChartSpec } from './schema'
import type { BarChartSpec, ChartVariant, EditorChartId, HeatmapChartSpec } from './types'
import { isPersistedEditorChartId } from './types'
import type { SpecsBundleExportV3 } from './exportImport'
import rawFactory from './factoryDefaultBundle.json'

export type FactoryEditorDefaults = {
  selectedChart: EditorChartId
  theme: 'light' | 'dark'
  inspectorTab: 'settings' | 'colors'
  /** Persisted chart when `selectedChart` is `palette`. */
  paletteReturnChart: SpecsBundleExportV3['selectedChart']
}

export type FactoryDefaultFile = {
  bundle: SpecsBundleExportV3
  editor: FactoryEditorDefaults
}

function migrateBundle(bundle: SpecsBundleExportV3): SpecsBundleExportV3 {
  return {
    version: 3,
    selectedChart: bundle.selectedChart,
    specsByVariant: {
      classic: migrateChartSpec(bundle.specsByVariant.classic) as BarChartSpec,
      breakdown: migrateChartSpec(bundle.specsByVariant.breakdown) as BarChartSpec,
      hierarchy: migrateChartSpec(bundle.specsByVariant.hierarchy) as BarChartSpec,
    },
    heatmapSpec: migrateChartSpec(bundle.heatmapSpec) as HeatmapChartSpec,
  }
}

let cached: FactoryDefaultFile | null = null

export function loadFactoryDefaults(): FactoryDefaultFile {
  if (cached) return cached
  const file = rawFactory as unknown as FactoryDefaultFile
  cached = {
    bundle: migrateBundle(file.bundle),
    editor: { ...file.editor },
  }
  return cached
}

export function factorySpecsByVariant(): Record<ChartVariant, BarChartSpec> {
  const { bundle } = loadFactoryDefaults()
  return {
    classic: structuredClone(bundle.specsByVariant.classic),
    breakdown: structuredClone(bundle.specsByVariant.breakdown),
    hierarchy: structuredClone(bundle.specsByVariant.hierarchy),
  }
}

export function factoryHeatmapSpec(): HeatmapChartSpec {
  return structuredClone(loadFactoryDefaults().bundle.heatmapSpec)
}

/** Replace committed factory defaults from an exported v3 bundle JSON string. */
export function parseFactoryDefaultFile(text: string): FactoryDefaultFile {
  const parsed = JSON.parse(text) as unknown
  if (
    parsed &&
    typeof parsed === 'object' &&
    'bundle' in parsed &&
    'editor' in parsed
  ) {
    const file = parsed as FactoryDefaultFile
    return {
      bundle: migrateBundle(file.bundle),
      editor: { ...file.editor },
    }
  }
  if (
    parsed &&
    typeof parsed === 'object' &&
    'version' in parsed &&
    (parsed as { version: number }).version === 3
  ) {
    const bundle = migrateBundle(parsed as SpecsBundleExportV3)
    const persisted = isPersistedEditorChartId(bundle.selectedChart)
      ? bundle.selectedChart
      : 'classic'
    return {
      bundle,
      editor: {
        selectedChart: persisted,
        theme: 'dark',
        inspectorTab: 'colors',
        paletteReturnChart: persisted,
      },
    }
  }
  throw new Error('Unrecognized factory defaults JSON')
}
