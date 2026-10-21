export type HeatmapCellScene = {
  kind: 'heatmapCell'
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  label: string
  labelColor: string
  state: 'default' | 'hover' | 'selected'
  progress: number
}

export type HeatmapColorLegendScene = {
  kind: 'heatmapColorLegend'
  x: number
  y: number
  width: number
  height: number
  minLabel: string
  maxLabel: string
  midLabel?: string
  /** Left-to-right sample colors. */
  samples: string[]
}

export type HitRegion = {
  id: string
  kind: 'bar' | 'chevron' | 'legend' | 'heatmapCell'
  x: number
  y: number
  width: number
  height: number
  meta?: Record<string, string | number | boolean>
}

export type BarRowScene = {
  kind: 'barRow'
  id: string
  x: number
  y: number
  width: number
  height: number
  barX: number
  barWidth: number
  fill: string
  stroke: string
  label: string
  labelX: number
  labelValueText?: string
  labelNameText?: string
  /** Bar-fill contrast for inside labels (value color encoding). */
  labelColor?: string
  depth?: number
  hasChildren?: boolean
  expanded?: boolean
  chevronBounds?: { x: number; y: number; width: number; height: number }
  state: 'default' | 'hover' | 'selected'
  progress: number
  /** Top of animated row slot (hierarchy reveal). */
  slotTop?: number
  /** Shared clip top for a reveal/collapse section (hierarchy). */
  revealClipTop?: number
  /** Visible section height while opening/closing; bars stay full size inside. */
  revealClipHeight?: number
  rowStride?: number
}

export type GroupTitleScene = {
  kind: 'groupTitle'
  text: string
  x: number
  y: number
  fontSize: number
}

export type AxisScene = {
  kind: 'axis'
  orientation: 'horizontal' | 'vertical'
  ticks: {
    x1: number
    y1: number
    x2: number
    y2: number
    label: string
    lx: number
    ly: number
    textAlign?: CanvasTextAlign
    /** Multi-line category labels (heatmap Y axis). */
    labelLines?: string[]
    lineHeight?: number
    /** Radians; e.g. -π/2 for vertical column labels. */
    labelRotation?: number
    fontSize?: number
    fontFamily?: string
    /** Clip + fade region for heatmap axis labels (fixed layout band). */
    labelBox?: { x: number; y: number; w: number; h: number }
  }[]
}

export type GridLineScene = {
  kind: 'gridLine'
  x1: number
  y1: number
  x2: number
  y2: number
}

export type LegendItemScene = {
  kind: 'legendItem'
  id: string
  x: number
  y: number
  color: string
  label: string
}

export type SceneGraph = {
  width: number
  height: number
  background: string
  barRows: BarRowScene[]
  heatmapCells: HeatmapCellScene[]
  heatmapColorLegend: HeatmapColorLegendScene | null
  groupTitles: GroupTitleScene[]
  axes: AxisScene[]
  gridLines: GridLineScene[]
  legendItems: LegendItemScene[]
  hits: HitRegion[]
}
