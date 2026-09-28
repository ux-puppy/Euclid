export type HitRegion = {
  id: string
  kind: 'bar' | 'chevron' | 'legend'
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
  groupTitles: GroupTitleScene[]
  axes: AxisScene[]
  gridLines: GridLineScene[]
  legendItems: LegendItemScene[]
  hits: HitRegion[]
}
