import { migrateChartSpec } from './schema'
import type {
  BarChartSpec,
  ChartSpec,
  ChartVariant,
  EditorChartId,
  HeatmapChartSpec,
  PersistedEditorChartId,
} from './types'
import { isBarChartSpec, isPersistedEditorChartId } from './types'

export function specForExport(spec: ChartSpec, expandedNodeIds: string[]): ChartSpec {
  const copy = structuredClone(spec)
  if (copy.data.shape === 'tree') {
    copy.data.expandedNodeIds = [...expandedNodeIds]
  }
  return copy
}

export type SpecsBundleExportV2 = {
  version: 2
  selectedVariant: ChartVariant
  specsByVariant: Record<ChartVariant, BarChartSpec>
}

export type SpecsBundleExportV3 = {
  version: 3
  selectedChart: PersistedEditorChartId
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
}

export function sanitizeSelectedChartForPersist(
  selected: EditorChartId,
  paletteReturnChart: PersistedEditorChartId,
): PersistedEditorChartId {
  if (selected !== 'palette') {
    return isPersistedEditorChartId(selected) ? selected : 'classic'
  }
  return paletteReturnChart
}

const BUNDLE_VARIANTS: ChartVariant[] = ['classic', 'breakdown', 'hierarchy']

export function isSpecsBundleExportV2(raw: unknown): raw is SpecsBundleExportV2 {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  if (o.version !== 2 || typeof o.selectedVariant !== 'string') return false
  if (!o.specsByVariant || typeof o.specsByVariant !== 'object') return false
  const bag = o.specsByVariant as Record<string, unknown>
  return BUNDLE_VARIANTS.every((v) => v in bag)
}

export function isSpecsBundleExportV3(raw: unknown): raw is SpecsBundleExportV3 {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  if (o.version !== 3 || typeof o.selectedChart !== 'string') return false
  if (!o.specsByVariant || typeof o.specsByVariant !== 'object') return false
  if (!o.heatmapSpec || typeof o.heatmapSpec !== 'object') return false
  const bag = o.specsByVariant as Record<string, unknown>
  return BUNDLE_VARIANTS.every((v) => v in bag)
}

export function bundleForExport(
  selectedChart: PersistedEditorChartId,
  specsByVariant: Record<ChartVariant, BarChartSpec>,
  heatmapSpec: HeatmapChartSpec,
  hierarchyExpandedIds: string[],
): SpecsBundleExportV3 {
  return {
    version: 3,
    selectedChart: isPersistedEditorChartId(selectedChart) ? selectedChart : 'classic',
    specsByVariant: {
      classic: specForExport(specsByVariant.classic, []) as BarChartSpec,
      breakdown: specForExport(specsByVariant.breakdown, []) as BarChartSpec,
      hierarchy: specForExport(specsByVariant.hierarchy, hierarchyExpandedIds) as BarChartSpec,
    },
    heatmapSpec: specForExport(heatmapSpec, []) as HeatmapChartSpec,
  }
}

export type ParsedImport =
  | { kind: 'bundle-v3'; bundle: SpecsBundleExportV3 }
  | { kind: 'bundle-v2'; bundle: SpecsBundleExportV2 }
  | { kind: 'single'; spec: ChartSpec }

export function parseImportedPayload(text: string): ParsedImport {
  const raw = JSON.parse(text) as unknown
  if (isSpecsBundleExportV3(raw)) {
    return {
      kind: 'bundle-v3',
      bundle: {
        version: 3,
        selectedChart: isPersistedEditorChartId(raw.selectedChart) ? raw.selectedChart : 'classic',
        specsByVariant: {
          classic: migrateChartSpec(raw.specsByVariant.classic) as BarChartSpec,
          breakdown: migrateChartSpec(raw.specsByVariant.breakdown) as BarChartSpec,
          hierarchy: migrateChartSpec(raw.specsByVariant.hierarchy) as BarChartSpec,
        },
        heatmapSpec: migrateChartSpec(raw.heatmapSpec) as HeatmapChartSpec,
      },
    }
  }
  if (isSpecsBundleExportV2(raw)) {
    return {
      kind: 'bundle-v2',
      bundle: {
        version: 2,
        selectedVariant: raw.selectedVariant,
        specsByVariant: {
          classic: migrateChartSpec(raw.specsByVariant.classic) as BarChartSpec,
          breakdown: migrateChartSpec(raw.specsByVariant.breakdown) as BarChartSpec,
          hierarchy: migrateChartSpec(raw.specsByVariant.hierarchy) as BarChartSpec,
        },
      },
    }
  }
  const spec = migrateChartSpec(raw)
  return { kind: 'single', spec }
}

export function downloadJSON(data: unknown, filename = 'euclid-chart.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyJSON(data: unknown) {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
}

export function parseImportedJSON(text: string): ChartSpec {
  return migrateChartSpec(JSON.parse(text))
}

export function isBarSpecForPalette(spec: ChartSpec): spec is BarChartSpec {
  return isBarChartSpec(spec)
}
