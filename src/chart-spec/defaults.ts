import {
  applyUnifiedDataToBundle,
  applyUnifiedDataToHeatmap,
  DEFAULT_UNIFIED_DATA,
} from '../data/unifiedData'
import { darkChartSurface, lightChartSurface } from './colorPresets'
import { DEFAULT_VISUALIZATION_PALETTE } from '../visualization-colors/defaults'
import { syncPaletteAssignments } from '../visualization-colors/syncAssignments'
import { uniformPadding } from './padding'
import {
  DEFAULT_CHART_PADDING,
  DEFAULT_HEATMAP_COLUMN_LABEL_BAND,
  DEFAULT_HEATMAP_ROW_LABEL_WIDTH,
  DEFAULT_TREE_MAX_DEPTH,
} from './constants'
export { CLASSIC_TABULAR_SERIES, DEFAULT_TREE_MAX_DEPTH } from './constants'
import { DEFAULT_HEATMAP_COLORS } from '../heatmap-colors/defaults'
import type {
  BarChartSpec,
  ChartSpec,
  ChartVariant,
  HeatmapChartSpec,
  SharedChartSpecBody,
  TabularData,
  TreeData,
} from './types'
import { deriveVariant, isBarChartSpec } from './types'
import { bundleForExport } from './exportImport'
import { factoryHeatmapSpec, factorySpecsByVariant } from './factoryDefaults'

/** Sample data defaults (Settings → Sample Data). Re-export for convenience. */
export { DEFAULT_UNIFIED_DATA as DEFAULT_SAMPLE_DATA } from '../data/unifiedData'

function sharedSpecPartial(): SharedChartSpecBody {
  return {
    schemaVersion: 2,
    chartPadding: DEFAULT_CHART_PADDING,
    containerCornerRadius: 0,
    typography: { fontFamily: 'DM Sans', baseFontSize: 14 },
    geometry: {
      barThickness: 36,
      barGap: 4,
      stackGap: 2,
      groupGap: 4,
      cornerRadius: 6,
      opacity: 1,
      borderWidth: 0,
    },
    labels: {
      show: false,
      position: 'inside',
      template: '{value} {label}',
      insetX: 9,
      insetY: 1,
      valueLabelGap: 0,
      valueColumnWidth: 31,
      labelOverflow: 'fade',
      valueFontFamily: 'DM Mono',
      valueFormat: { style: 'number', decimals: 0, prefix: '', suffix: '' },
    },
    axes: {
      x: { show: false, label: '', tickCount: 3, fontSize: 11 },
      y: { show: false, label: '', tickCount: 3, fontSize: 11 },
    },
    grid: {
      show: false,
      color: darkChartSurface.grid,
      opacity: 1,
      strokeWidth: 1,
      dash: [4, 4],
    },
    legend: { show: false, position: 'bottom', fontSize: 11 },
    tooltip: { show: false, background: darkChartSurface.tooltip, fontSize: 12 },
    interaction: { hover: false, select: false, focus: false },
    animation: {
      enabled: false,
      duration: 900,
      delay: 0,
      easing: 'ease-out',
      customBezier: [0, 0, 0.6, 1],
      stagger: 40,
      direction: 'left-right',
      trigger: 'load',
    },
    renderer: { devicePixelRatio: 'auto', antialias: true },
  }
}

function barColors(): BarChartSpec['colors'] {
  return {
    surfaceByTheme: {
      light: { ...lightChartSurface },
      dark: { ...darkChartSurface },
    },
    encoding: 'categorical',
    visualization: structuredClone(DEFAULT_VISUALIZATION_PALETTE),
    heatmap: structuredClone(DEFAULT_HEATMAP_COLORS),
  }
}

function placeholderTabularData(): TabularData {
  const p = DEFAULT_UNIFIED_DATA
  return {
    shape: 'tabular',
    categories: ['—'],
    series: [{ id: 'placeholder', name: '—', values: [0] }],
    provenance: {
      pattern: p.pattern,
      seriesPattern: p.seriesPattern,
      seed: p.seed,
      params: {
        categoryCount: p.categoryCount,
        seriesCount: p.seriesCount,
        maxDepth: p.maxDepth,
      },
    },
  }
}

function placeholderTreeData(): TreeData {
  const p = DEFAULT_UNIFIED_DATA
  return {
    shape: 'tree',
    root: { id: 'virtual-root', label: 'All', value: 0, children: [] },
    defaultExpandedDepth: 1,
    provenance: {
      pattern: p.pattern,
      seriesPattern: p.seriesPattern,
      seed: p.seed,
      params: {
        categoryCount: p.categoryCount,
        seriesCount: p.seriesCount,
        maxDepth: p.maxDepth,
      },
    },
  }
}

export function createClassicSpec(): BarChartSpec {
  const layout = {
    mode: 'cartesian' as const,
    width: 640,
    height: 400,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    orientation: 'horizontal' as const,
    barLayout: 'grouped' as const,
  }
  return {
    ...sharedSpecPartial(),
    chartType: 'bar',
    variant: 'classic',
    colors: barColors(),
    data: placeholderTabularData(),
    layout,
  }
}

export function createBreakdownSpec(): BarChartSpec {
  const layout = {
    mode: 'list' as const,
    width: 520,
    height: 400,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    valueScale: 'global' as const,
    rowGap: 4,
    groupGap: 22,
    indentPerLevel: 10,
    groupTitle: { show: false, fontSize: 14 },
    showChevron: false,
    showExpandAllControl: false,
  }
  return {
    ...sharedSpecPartial(),
    chartType: 'bar',
    variant: 'breakdown',
    colors: barColors(),
    data: placeholderTabularData(),
    layout,
    legend: { show: false, position: 'bottom', fontSize: 11 },
    grid: { ...sharedSpecPartial().grid, show: false },
    axes: {
      x: { show: false, label: '', tickCount: 5, fontSize: 11 },
      y: { show: false, label: '', tickCount: 5, fontSize: 11 },
    },
  }
}

export function createHierarchySpec(): BarChartSpec {
  const layout = {
    mode: 'list' as const,
    width: 520,
    height: 400,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    valueScale: 'global' as const,
    rowGap: 4,
    groupGap: 22,
    indentPerLevel: 10,
    groupTitle: { show: false, fontSize: 14 },
    showChevron: false,
    showExpandAllControl: false,
  }
  return {
    ...sharedSpecPartial(),
    chartType: 'bar',
    variant: 'hierarchy',
    colors: barColors(),
    data: placeholderTreeData(),
    layout,
    legend: { show: false, position: 'bottom', fontSize: 11 },
    grid: { ...sharedSpecPartial().grid, show: false },
    labels: {
      ...sharedSpecPartial().labels,
      template: '{value} {label}',
    },
  }
}

export function buildProgrammaticHeatmapSpec(): HeatmapChartSpec {
  const layout = {
    mode: 'heatmap' as const,
    width: 640,
    height: 400,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    cellWidth: 40,
    cellHeight: 40,
    lockCellSize: true,
    gap: 4,
    columnLabelOffsetX: 16,
    columnLabelOffsetY: 13,
    rowLabelOffsetX: -6,
    rowLabelOffsetY: 0,
    rowLabelWidth: DEFAULT_HEATMAP_ROW_LABEL_WIDTH,
    columnLabelBandHeight: DEFAULT_HEATMAP_COLUMN_LABEL_BAND,
  }
  const spec: HeatmapChartSpec = {
    ...sharedSpecPartial(),
    chartType: 'heatmap',
    variant: 'heatmap',
    colors: {
      surfaceByTheme: {
        light: { ...lightChartSurface },
        dark: { ...darkChartSurface },
      },
      heatmap: structuredClone(DEFAULT_HEATMAP_COLORS),
    },
    data: placeholderTabularData(),
    layout,
    legend: { show: false, position: 'bottom', fontSize: 11 },
    axes: {
      x: { show: false, label: '', tickCount: 3, fontSize: 11 },
      y: { show: false, label: '', tickCount: 3, fontSize: 11 },
    },
    labels: {
      ...sharedSpecPartial().labels,
      show: false,
      template: '{value}',
      valueFormat: { style: 'number', decimals: 1, prefix: '', suffix: '' },
    },
    animation: {
      ...sharedSpecPartial().animation,
      direction: 'top-bottom',
    },
  }
  applyUnifiedDataToHeatmap(spec, DEFAULT_UNIFIED_DATA)
  return spec
}

/** Programmatic bundle used to regenerate `factoryDefaultBundle.json`. */
export function buildProgrammaticFactoryBundle(): Record<ChartVariant, BarChartSpec> {
  const bundle = {
    classic: createClassicSpec(),
    breakdown: createBreakdownSpec(),
    hierarchy: createHierarchySpec(),
  }
  applyUnifiedDataToBundle(bundle, DEFAULT_UNIFIED_DATA)
  for (const v of Object.values(bundle)) {
    syncPaletteAssignments(v)
  }
  return bundle
}

export function buildProgrammaticFactoryExport() {
  const specsByVariant = buildProgrammaticFactoryBundle()
  const heatmapSpec = buildProgrammaticHeatmapSpec()
  return bundleForExport('classic', specsByVariant, heatmapSpec, [])
}

export function createInitialSpecsBundle(): Record<ChartVariant, BarChartSpec> {
  return factorySpecsByVariant()
}

export function createHeatmapSpec(): HeatmapChartSpec {
  return factoryHeatmapSpec()
}

export function createSpecForVariant(variant: ChartVariant): BarChartSpec {
  return createInitialSpecsBundle()[variant]
}

export function syncVariantField(spec: ChartSpec): ChartSpec {
  if (!isBarChartSpec(spec)) return spec
  const variant = deriveVariant(spec.data, spec.layout)
  if (spec.variant === variant) return spec
  return { ...spec, variant }
}

