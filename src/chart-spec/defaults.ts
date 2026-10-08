import {
  applyUnifiedDataToBundle,
  applyUnifiedDataToHeatmap,
  DEFAULT_UNIFIED_DATA,
} from '../data/unifiedData'
import { darkChartSurface, lightChartSurface } from './colorPresets'
import { DEFAULT_VISUALIZATION_PALETTE } from '../visualization-colors/defaults'
import { syncPaletteAssignments } from '../visualization-colors/syncAssignments'
import { uniformPadding } from './padding'
import { DEFAULT_CHART_PADDING, DEFAULT_TREE_MAX_DEPTH } from './constants'
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

/** Sample data defaults (Settings → Sample Data). Re-export for convenience. */
export { DEFAULT_UNIFIED_DATA as DEFAULT_SAMPLE_DATA } from '../data/unifiedData'

function sharedSpecPartial(): SharedChartSpecBody {
  return {
    schemaVersion: 2,
    chartPadding: DEFAULT_CHART_PADDING,
    containerCornerRadius: 12,
    typography: { fontFamily: 'DM Sans', baseFontSize: 12 },
    geometry: {
      barThickness: 18,
      barGap: 4,
      stackGap: 2,
      groupGap: 12,
      cornerRadius: 6,
      opacity: 1,
      borderWidth: 0,
    },
    labels: {
      show: true,
      position: 'inside',
      template: '{value} {label}',
      insetX: 8,
      insetY: 0,
      valueLabelGap: 6,
      valueColumnWidth: 52,
      labelOverflow: 'fade',
      valueFontFamily: 'DM Mono',
      valueFormat: { style: 'number', decimals: 0, prefix: '', suffix: '' },
    },
    axes: {
      x: { show: true, label: '', tickCount: 5, fontSize: 11 },
      y: { show: true, label: '', tickCount: 5, fontSize: 11 },
    },
    grid: {
      show: true,
      color: darkChartSurface.grid,
      opacity: 1,
      strokeWidth: 1,
      dash: [],
    },
    legend: { show: true, position: 'bottom', fontSize: 11 },
    tooltip: { show: false, background: darkChartSurface.tooltip, fontSize: 12 },
    interaction: { hover: true, select: true, focus: true },
    animation: {
      enabled: true,
      duration: 250,
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
    height: 'auto' as const,
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
    height: 'auto' as const,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    valueScale: 'global' as const,
    rowGap: 6,
    groupGap: 20,
    indentPerLevel: 16,
    groupTitle: { show: true, fontSize: 14 },
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
    height: 'auto' as const,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    valueScale: 'global' as const,
    rowGap: 4,
    groupGap: 0,
    indentPerLevel: 20,
    groupTitle: { show: false, fontSize: 14 },
    showChevron: false,
    showExpandAllControl: true,
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

export function createHeatmapSpec(): HeatmapChartSpec {
  const layout = {
    mode: 'heatmap' as const,
    width: 640,
    height: 'auto' as const,
    padding: uniformPadding(DEFAULT_CHART_PADDING),
    cellWidth: 40,
    cellHeight: 40,
    lockCellSize: true,
    gap: 4,
    columnLabelOffsetX: 0,
    columnLabelOffsetY: 0,
    rowLabelOffsetX: 0,
    rowLabelOffsetY: 0,
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
    legend: { show: true, position: 'bottom', fontSize: 11 },
    labels: {
      ...sharedSpecPartial().labels,
      show: true,
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

export function createInitialSpecsBundle(): Record<ChartVariant, BarChartSpec> {
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

export function createSpecForVariant(variant: ChartVariant): BarChartSpec {
  return createInitialSpecsBundle()[variant]
}

export function syncVariantField(spec: ChartSpec): ChartSpec {
  if (!isBarChartSpec(spec)) return spec
  const variant = deriveVariant(spec.data, spec.layout)
  if (spec.variant === variant) return spec
  return { ...spec, variant }
}
