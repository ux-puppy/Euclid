import { applyUnifiedDataToBundle, DEFAULT_UNIFIED_DATA } from '../data/unifiedData'
import { generateTabularData, generateTreeData } from '../data/generate'
import { darkChartSurface, lightChartSurface } from './colorPresets'
import { DEFAULT_VISUALIZATION_PALETTE } from '../visualization-colors/defaults'
import { syncPaletteAssignments } from '../visualization-colors/syncAssignments'
import { uniformPadding } from './padding'
import { DEFAULT_CHART_PADDING, DEFAULT_TREE_MAX_DEPTH } from './constants'
export { CLASSIC_TABULAR_SERIES, DEFAULT_TREE_MAX_DEPTH } from './constants'
import type { ChartSpec, ChartVariant } from './types'
import { deriveVariant } from './types'

function sharedSpecPartial(): Omit<ChartSpec, 'variant' | 'data' | 'layout'> {
  return {
    schemaVersion: 2,
    chartType: 'bar',
    chartPadding: DEFAULT_CHART_PADDING,
    containerCornerRadius: 12,
    typography: { fontFamily: 'DM Sans', baseFontSize: 12 },
    colors: {
      surfaceByTheme: {
        light: { ...lightChartSurface },
        dark: { ...darkChartSurface },
      },
      visualization: structuredClone(DEFAULT_VISUALIZATION_PALETTE),
    },
    geometry: {
      barThickness: 18,
      barGap: 4,
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
      valueLabelGap: 6,
      valueColumnWidth: 52,
      labelOverflow: 'overflow',
      valueFontFamily: 'DM Mono',
      valueFormat: { style: 'percent', decimals: 0, prefix: '', suffix: '%' },
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
    tooltip: { show: true, background: darkChartSurface.tooltip, fontSize: 12 },
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

export function createClassicSpec(): ChartSpec {
  const data = generateTabularData('random', 42, {
    categoryCount: 6,
    seriesCount: 1,
  })
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
    variant: 'classic',
    data,
    layout,
  }
}

export function createBreakdownSpec(): ChartSpec {
  const data = generateTabularData('bell-curve', 7, {
    categoryCount: 4,
    seriesCount: 5,
  })
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
    variant: 'breakdown',
    data,
    layout,
    legend: { show: false, position: 'bottom', fontSize: 11 },
    grid: { ...sharedSpecPartial().grid, show: false },
    axes: {
      x: { show: false, label: '', tickCount: 5, fontSize: 11 },
      y: { show: false, label: '', tickCount: 5, fontSize: 11 },
    },
  }
}

export function createHierarchySpec(): ChartSpec {
  const data = generateTreeData('balanced', 99, {
    maxDepth: DEFAULT_TREE_MAX_DEPTH,
    branchMin: 2,
    branchMax: 4,
  })
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
    variant: 'hierarchy',
    data,
    layout,
    legend: { show: false, position: 'bottom', fontSize: 11 },
    grid: { ...sharedSpecPartial().grid, show: false },
    labels: {
      ...sharedSpecPartial().labels,
      template: '{value} {label}',
    },
  }
}

export function createInitialSpecsBundle(): Record<ChartVariant, ChartSpec> {
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

export function createSpecForVariant(variant: ChartVariant): ChartSpec {
  return createInitialSpecsBundle()[variant]
}

export function syncVariantField(spec: ChartSpec): ChartSpec {
  const variant = deriveVariant(spec.data, spec.layout)
  if (spec.variant === variant) return spec
  return { ...spec, variant }
}
