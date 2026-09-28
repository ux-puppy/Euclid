import { migrateChartSpec } from './schema'
import type { ChartSpec, ChartVariant } from './types'

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
  specsByVariant: Record<ChartVariant, ChartSpec>
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

export function bundleForExport(
  selectedVariant: ChartVariant,
  specsByVariant: Record<ChartVariant, ChartSpec>,
  hierarchyExpandedIds: string[],
): SpecsBundleExportV2 {
  return {
    version: 2,
    selectedVariant,
    specsByVariant: {
      classic: specForExport(specsByVariant.classic, []),
      breakdown: specForExport(specsByVariant.breakdown, []),
      hierarchy: specForExport(specsByVariant.hierarchy, hierarchyExpandedIds),
    },
  }
}

export type ParsedImport =
  | { kind: 'bundle'; bundle: SpecsBundleExportV2 }
  | { kind: 'single'; spec: ChartSpec }

export function parseImportedPayload(text: string): ParsedImport {
  const raw = JSON.parse(text) as unknown
  if (isSpecsBundleExportV2(raw)) {
    return {
      kind: 'bundle',
      bundle: {
        version: 2,
        selectedVariant: raw.selectedVariant,
        specsByVariant: {
          classic: migrateChartSpec(raw.specsByVariant.classic),
          breakdown: migrateChartSpec(raw.specsByVariant.breakdown),
          hierarchy: migrateChartSpec(raw.specsByVariant.hierarchy),
        },
      },
    }
  }
  return { kind: 'single', spec: migrateChartSpec(raw) }
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
  const parsed = parseImportedPayload(text)
  if (parsed.kind === 'single') return parsed.spec
  return parsed.bundle.specsByVariant[parsed.bundle.selectedVariant]
}
