export type ChartVariant = 'classic' | 'breakdown' | 'hierarchy'

export type TabularPatternId =
  | 'random'
  | 'increasing'
  | 'decreasing'
  | 'bell-curve'
  | 'wave'
  | 'peaks-valleys'
  | 'uniform'
  | 'clustered'
  | 'outliers'
  | 'positive-negative'
  | 'sparse'

export type TreePatternId = 'balanced' | 'skewed' | 'wide-shallow' | 'random-tree'

export type PatternId = TabularPatternId | TreePatternId | 'custom'

export type Provenance = {
  pattern: PatternId
  seed: number
  params: Record<string, number>
} | null

export type DataNode = {
  id: string
  label: string
  value: number
  color?: string
  children?: DataNode[]
}

export type TabularData = {
  shape: 'tabular'
  categories: string[]
  series: { id: string; name: string; values: number[] }[]
  provenance: Provenance
}

export type TreeData = {
  shape: 'tree'
  root: DataNode
  defaultExpandedDepth: number
  expandedNodeIds?: string[]
  provenance: Provenance
}

export type ChartData = TabularData | TreeData

export type Padding = { top: number; right: number; bottom: number; left: number }

export type CartesianLayout = {
  mode: 'cartesian'
  width: number
  height: number | 'auto'
  padding: Padding
  orientation: 'vertical' | 'horizontal'
  barLayout: 'grouped' | 'stacked'
}

export type ListLayout = {
  mode: 'list'
  width: number
  height: number | 'auto'
  padding: Padding
  valueScale: 'global' | 'group' | 'parent'
  rowGap: number
  groupGap: number
  indentPerLevel: number
  groupTitle: { show: boolean; fontSize: number }
  showChevron: boolean
  showExpandAllControl: boolean
}

export type ChartLayout = CartesianLayout | ListLayout

export type AxisConfig = {
  show: boolean
  label: string
  tickCount: number
  fontSize: number
}

export type GridConfig = {
  show: boolean
  color: string
  opacity: number
  strokeWidth: number
  dash: number[]
}

export type LegendConfig = {
  show: boolean
  position: 'top' | 'bottom' | 'right' | 'left'
  fontSize: number
}

export type TooltipConfig = {
  show: boolean
  background: string
  fontSize: number
}

export type EasingPreset =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'custom'

export type AnimationConfig = {
  enabled: boolean
  duration: number
  delay: number
  easing: EasingPreset
  customBezier: [number, number, number, number]
  stagger: number
  direction: 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top'
  trigger: 'load' | 'replay' | 'expand'
}

import type { VisualizationPaletteConfig } from '../visualization-colors/types'

export type ChartSurfaceColors = {
  background: string
  text: string
  textSecondary: string
  axis: string
  grid: string
  hover: string
  selected: string
  tooltip: string
  border: string
  barHoverBorder: string
  barSelectedBorder: string
}

export type ChartSurfaceByTheme = {
  light: ChartSurfaceColors
  dark: ChartSurfaceColors
}

export type ChartColors = {
  surfaceByTheme: ChartSurfaceByTheme
  visualization: VisualizationPaletteConfig
}

/** @deprecated Use ChartSurfaceColors; kept for preset migration helpers. */
export type ColorTokens = ChartSurfaceColors & {
  series: string[]
  depth: string[]
}

export type ChartSpec = {
  schemaVersion: 2
  chartType: 'bar'
  variant: ChartVariant
  /** Uniform padding (px): preview inset + layout padding on all sides. */
  chartPadding: number
  /** Corner radius (px) of the preview panel container. */
  containerCornerRadius: number
  data: ChartData
  layout: ChartLayout
  typography: {
    fontFamily: string
    baseFontSize: number
  }
  colors: ChartColors
  geometry: {
    barThickness: number
    barGap: number
    groupGap: number
    cornerRadius: number
    opacity: number
    borderWidth: number
  }
  labels: {
    show: boolean
    position: 'inside' | 'outside' | 'auto'
    template: string
    /** Horizontal inset from the bar start (px). */
    insetX: number
    /** Gap between formatted value and label name (px). */
    valueLabelGap: number
    /** Fixed width (px) for the value column so names align across rows. */
    valueColumnWidth: number
    labelOverflow: 'clip' | 'overflow' | 'outside'
    valueFontFamily: string
    valueFormat: {
      style: 'percent' | 'number'
      decimals: number
      prefix: string
      suffix: string
    }
  }
  axes: { x: AxisConfig; y: AxisConfig }
  grid: GridConfig
  legend: LegendConfig
  tooltip: TooltipConfig
  interaction: {
    hover: boolean
    select: boolean
    focus: boolean
  }
  animation: AnimationConfig
  renderer: {
    devicePixelRatio: 'auto' | number
    antialias: boolean
  }
}

export function deriveVariant(data: ChartData, layout: ChartLayout): ChartVariant {
  if (data.shape === 'tree' && layout.mode === 'list') return 'hierarchy'
  if (data.shape === 'tabular' && layout.mode === 'list') return 'breakdown'
  return 'classic'
}
