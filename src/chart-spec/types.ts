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
  /** Value shape across series (columns / subspecies); defaults to `pattern` when omitted. */
  seriesPattern?: TabularPatternId
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

/** Categories × series grid: each category is a parent bar; series are stack segments. */
export type TabularCompositionGrid = {
  categories: string[]
  series: { id: string; name: string; values: number[] }[]
}

export type TabularData = {
  shape: 'tabular'
  categories: string[]
  series: { id: string; name: string; values: number[] }[]
  provenance: Provenance
  /** Classic bundle: full parent/child matrix for cartesian stacked (from breakdown). */
  composition?: TabularCompositionGrid
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

import type { HeatmapColorConfig } from '../heatmap-colors/types'
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

export type BarColorEncoding = 'categorical' | 'value'

export type BarChartColors = {
  surfaceByTheme: ChartSurfaceByTheme
  /** Categorical = OKLCH series palette; value = heatmap scale by bar magnitude. */
  encoding: BarColorEncoding
  visualization: VisualizationPaletteConfig
  heatmap: HeatmapColorConfig
}

export type HeatmapChartColors = {
  surfaceByTheme: ChartSurfaceByTheme
  heatmap: HeatmapColorConfig
}

/** @deprecated Use BarChartColors */
export type ChartColors = BarChartColors

/** @deprecated Use ChartSurfaceColors; kept for preset migration helpers. */
export type ColorTokens = ChartSurfaceColors & {
  series: string[]
  depth: string[]
}

export type HeatmapLayout = {
  mode: 'heatmap'
  width: number
  height: number | 'auto'
  padding: Padding
  /** Fixed cell width (px). */
  cellWidth: number
  /** Fixed cell height (px). */
  cellHeight: number
  /** When true, changing width or height updates the other to match. */
  lockCellSize: boolean
  /** Gap between cells (rows and columns). */
  gap: number
  /** Nudge column labels horizontally (px). */
  columnLabelOffsetX: number
  /** Nudge column labels vertically from default anchor below grid (px). */
  columnLabelOffsetY: number
  /** Nudge row labels horizontally from default anchor (px). */
  rowLabelOffsetX: number
  /** Nudge row labels vertically (px). */
  rowLabelOffsetY: number
  /** Fixed width (px) for row label column; long text fades within this band. */
  rowLabelWidth: number
  /** Fixed height (px) below grid for column labels; long text fades within this band. */
  columnLabelBandHeight: number
}

export type ChartGeometry = {
  barThickness: number
  barGap: number
  /** Horizontal gap between segments in a stacked bar (px). */
  stackGap: number
  groupGap: number
  cornerRadius: number
  opacity: number
  borderWidth: number
}

export type ChartLabels = {
  show: boolean
  position: 'inside' | 'outside' | 'auto'
  template: string
  /** Horizontal inset from the bar start (px). */
  insetX: number
  /** Vertical offset from bar/cell center (px); positive moves down. */
  insetY: number
  /** Gap between formatted value and label name (px). */
  valueLabelGap: number
  /** Fixed width (px) for the value column so names align across rows. */
  valueColumnWidth: number
  labelOverflow: 'fade' | 'clip' | 'overflow' | 'outside'
  valueFontFamily: string
  valueFormat: {
    style: 'percent' | 'number'
    decimals: number
    prefix: string
    suffix: string
  }
}

export type SharedChartSpecBody = {
  schemaVersion: 2
  /** Uniform padding (px): preview inset + layout padding on all sides. */
  chartPadding: number
  /** Corner radius (px) of the preview panel container. */
  containerCornerRadius: number
  typography: {
    fontFamily: string
    baseFontSize: number
  }
  geometry: ChartGeometry
  labels: ChartLabels
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

export type BarChartSpec = SharedChartSpecBody & {
  chartType: 'bar'
  variant: ChartVariant
  data: ChartData
  layout: ChartLayout
  colors: BarChartColors
}

export type HeatmapChartSpec = SharedChartSpecBody & {
  chartType: 'heatmap'
  variant: 'heatmap'
  data: TabularData
  layout: HeatmapLayout
  colors: HeatmapChartColors
}

export type ChartSpec = BarChartSpec | HeatmapChartSpec

export type PersistedEditorChartId = ChartVariant | 'heatmap'

/** Includes UI-only `palette` (not stored in export/autosave). */
export type EditorChartId = PersistedEditorChartId | 'palette'

export function isPersistedEditorChartId(id: string): id is PersistedEditorChartId {
  return id === 'heatmap' || id === 'classic' || id === 'breakdown' || id === 'hierarchy'
}

export function isBarChartSpec(spec: ChartSpec): spec is BarChartSpec {
  return spec.chartType === 'bar'
}

export function isBarValueColorEncoding(colors: BarChartColors): boolean {
  return colors.encoding === 'value'
}

export function isHeatmapChartSpec(spec: ChartSpec): spec is HeatmapChartSpec {
  return spec.chartType === 'heatmap'
}

export function deriveVariant(data: ChartData, layout: ChartLayout | HeatmapLayout): ChartVariant {
  if (layout.mode === 'heatmap') return 'classic'
  if (data.shape === 'tree' && layout.mode === 'list') return 'hierarchy'
  if (data.shape === 'tabular' && layout.mode === 'list') return 'breakdown'
  return 'classic'
}
