import { themeAdaptGradient } from '../heatmap-colors/themeAdapt'
import type { HeatmapColorConfig, HeatmapGradient } from '../heatmap-colors/types'
import {
  maxTreeDepth,
  requiredColorCount,
  resolvePaletteSequence,
  resolveVisualizationColors,
} from '../visualization-colors/resolve'
import type {
  BarChartSpec,
  ChartSurfaceColors,
  ChartVariant,
  HeatmapChartSpec,
} from './types'
import { colorTokenToDisplayHex } from '../lib/colorFormat'
import { isBarValueColorEncoding } from './types'

export type PaletteTokenEntry = {
  token: string
  label: string
  light: string
  dark: string
}

export type PaletteCatalogSection = {
  id: string
  title: string
  entries: PaletteTokenEntry[]
}

export type PaletteCatalog = {
  sections: PaletteCatalogSection[]
}

const SURFACE_LABELS: Record<keyof ChartSurfaceColors, string> = {
  background: 'Background',
  text: 'Text',
  textSecondary: 'On viz text',
  axis: 'Axis',
  grid: 'Grid',
  hover: 'Tooltip text',
  selected: 'Selected',
  tooltip: 'Tooltip surface',
  border: 'Border',
  barHoverBorder: 'Bar hover border',
  barSelectedBorder: 'Bar selected border',
}

const CHART_VARIANTS: ChartVariant[] = ['classic', 'breakdown', 'hierarchy']

function pairForThemes(
  token: string,
  label: string,
  lightHex: string,
  darkHex: string,
): PaletteTokenEntry {
  return {
    token,
    label,
    light: colorTokenToDisplayHex(lightHex),
    dark: colorTokenToDisplayHex(darkHex),
  }
}

function surfaceSection(bar: BarChartSpec): PaletteCatalogSection {
  const keys = Object.keys(SURFACE_LABELS) as (keyof ChartSurfaceColors)[]
  const entries = keys.map((key) =>
    pairForThemes(
      `surface.${key}`,
      SURFACE_LABELS[key],
      bar.colors.surfaceByTheme.light[key],
      bar.colors.surfaceByTheme.dark[key],
    ),
  )
  return { id: 'surface', title: 'Surface', entries }
}

function maxSeriesSlotCount(specsByVariant: Record<ChartVariant, BarChartSpec>): number {
  let max = 1
  for (const v of CHART_VARIANTS) {
    max = Math.max(max, requiredColorCount(specsByVariant[v]))
  }
  return max
}

function seriesSection(
  bar: BarChartSpec,
  slotCount: number,
): PaletteCatalogSection {
  const config = bar.colors.visualization
  const lightSeq = resolvePaletteSequence(config, 'light', slotCount)
  const darkSeq = resolvePaletteSequence(config, 'dark', slotCount)

  const entries: PaletteTokenEntry[] = []
  for (let i = 0; i < slotCount; i++) {
    const light = lightSeq[i]?.hex ?? lightSeq[0]?.hex ?? '#888888'
    const dark = darkSeq[i]?.hex ?? darkSeq[0]?.hex ?? '#888888'
    const token = `viz.color.${i + 1}`
    entries.push(pairForThemes(token, token, light, dark))
  }
  return { id: 'viz', title: 'Visualization colors', entries }
}

function depthSection(hierarchy: BarChartSpec): PaletteCatalogSection | null {
  const depthLevels = maxTreeDepth(hierarchy)
  if (depthLevels <= 0) return null

  const config = hierarchy.colors.visualization
  const lightViz = resolveVisualizationColors(config, hierarchy, 'light')
  const darkViz = resolveVisualizationColors(config, hierarchy, 'dark')
  const entries: PaletteTokenEntry[] = []

  for (let d = 0; d < depthLevels; d++) {
    const light = lightViz.depthByLevel[d] ?? lightViz.seriesByIndex[0] ?? '#888888'
    const dark = darkViz.depthByLevel[d] ?? darkViz.seriesByIndex[0] ?? '#888888'
    entries.push(pairForThemes(`depth.${d}`, `Depth level ${d}`, light, dark))
  }

  return { id: 'depth', title: 'Hierarchy depth', entries }
}

function gradientStopEntries(
  prefix: string,
  titlePrefix: string,
  gradient: HeatmapGradient,
  config: HeatmapColorConfig,
): PaletteTokenEntry[] {
  const lightGrad = themeAdaptGradient(gradient, config, 'light')
  const darkGrad = themeAdaptGradient(gradient, config, 'dark')
  const count = Math.max(lightGrad.stops.length, darkGrad.stops.length)
  const entries: PaletteTokenEntry[] = []

  for (let i = 0; i < count; i++) {
    const lightStop = lightGrad.stops[i]
    const darkStop = darkGrad.stops[i]
    const pos = lightStop?.position ?? darkStop?.position ?? 0
    entries.push(
      pairForThemes(
        `${prefix}.stop.${i}`,
        `${titlePrefix} stop ${i + 1} (${Math.round(pos * 100)}%)`,
        lightStop?.color ?? '#888888',
        darkStop?.color ?? '#888888',
      ),
    )
  }
  return entries
}

function heatmapConfigSections(
  config: HeatmapColorConfig,
  tokenPrefix: string,
  titlePrefix: string,
): PaletteCatalogSection[] {
  const sections: PaletteCatalogSection[] = []

  const sequential = gradientStopEntries(
    `${tokenPrefix}.sequential`,
    `${titlePrefix} sequential`,
    config.sequential,
    config,
  )
  if (sequential.length) {
    sections.push({
      id: `${tokenPrefix}-sequential`,
      title: `${titlePrefix} · sequential`,
      entries: sequential,
    })
  }

  if (config.mode === 'diverging' && sequential.length) {
    sections[sections.length - 1] = {
      id: `${tokenPrefix}-diverging`,
      title: `${titlePrefix} · diverging`,
      entries: sequential,
    }
  }

  return sections
}

export function buildPaletteCatalog(input: {
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
}): PaletteCatalog {
  const bar = input.specsByVariant.classic
  const sections: PaletteCatalogSection[] = []

  const slotCount = maxSeriesSlotCount(input.specsByVariant)
  sections.push(seriesSection(bar, slotCount))

  const depth = depthSection(input.specsByVariant.hierarchy)
  if (depth) sections.push(depth)

  if (isBarValueColorEncoding(bar.colors)) {
    sections.push(
      ...heatmapConfigSections(bar.colors.heatmap, 'barValueScale', 'Bar value scale'),
    )
  }

  sections.push(...heatmapConfigSections(input.heatmapSpec.colors.heatmap, 'heatmap', 'Heatmap'))

  sections.push(surfaceSection(bar))

  return { sections }
}
