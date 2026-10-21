import { labelOnFillOverBackground } from '../../accessibility/contrast'
import { resolveSurfaceForTheme } from '../../chart-spec/surfaceColors'
import type { HeatmapChartSpec } from '../../chart-spec/types'
import { formatLabelTemplate, formatValue } from '../../data/format'
import { normalizeHeatmapColors } from '../../heatmap-colors/defaults'
import {
  colorForHeatmapValue,
  domainFromValues,
  sampleHeatmapLegend,
} from '../../heatmap-colors/resolve'
import { applyHeatmapTheme } from '../../heatmap-colors/themeAdapt'
import type { ChartTheme } from '../../visualization-colors/types'
import { barStrokeForState } from '../bar/barInteractionStyle'
import type { AxisScene, HeatmapCellScene, SceneGraph } from '../bar/types'
import { DEFAULT_HEATMAP_COLUMN_LABEL_BAND, DEFAULT_HEATMAP_ROW_LABEL_WIDTH } from '../../chart-spec/constants'

function staggerIndex(
  row: number,
  col: number,
  rows: number,
  cols: number,
  direction: HeatmapChartSpec['animation']['direction'],
): number {
  switch (direction) {
    case 'right-left':
      return row * cols + (cols - 1 - col)
    case 'bottom-top':
      return (rows - 1 - row) * cols + col
    case 'top-bottom':
      return row * cols + col
    case 'left-right':
    default:
      return col * rows + row
  }
}

export function computeHeatmapLayout(
  spec: HeatmapChartSpec,
  theme: ChartTheme,
  hoverId: string | null,
  selectId: string | null,
  animProgress: number,
): SceneGraph {
  const { layout, data, labels, axes, legend, animation, typography } = spec
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const { padding } = layout
  const categoryCount = data.categories.length
  const seriesCount = data.series.length
  const values = data.series.flatMap((s) => s.values)
  const domain = domainFromValues(values)
  const heatmapColors = applyHeatmapTheme(
    normalizeHeatmapColors(spec.colors.heatmap),
    theme,
  )

  const cellW = Math.max(8, layout.cellWidth)
  const cellH = Math.max(8, layout.cellHeight)
  const gap = Math.max(0, layout.gap)
  const columnLabelOffsetX = layout.columnLabelOffsetX ?? 0
  const columnLabelOffsetY = layout.columnLabelOffsetY ?? 0
  const rowLabelOffsetX = layout.rowLabelOffsetX ?? 0
  const rowLabelOffsetY = layout.rowLabelOffsetY ?? 0
  const rowLabelWidth = Math.max(0, layout.rowLabelWidth ?? DEFAULT_HEATMAP_ROW_LABEL_WIDTH)
  const columnLabelBandHeight = Math.max(
    0,
    layout.columnLabelBandHeight ?? DEFAULT_HEATMAP_COLUMN_LABEL_BAND,
  )
  /** Space between axis labels and the cell grid; matches cell gap (0 = flush). */
  const labelGridGap = gap

  const gridW =
    seriesCount * cellW + Math.max(0, seriesCount - 1) * gap
  const gridH =
    categoryCount * cellH + Math.max(0, categoryCount - 1) * gap

  const yFontSize = axes.y.fontSize
  const xFontSize = axes.x.fontSize
  const yLabelBand = axes.y.show
    ? rowLabelWidth + labelGridGap + Math.max(0, -rowLabelOffsetX)
    : 0

  const xLabelBand = axes.x.show
    ? labelGridGap + columnLabelBandHeight + Math.max(0, columnLabelOffsetY)
    : 0

  const colorLegendH =
    legend.show && legend.position === 'bottom' ? legend.fontSize + 28 : 0

  const autoHeight = layout.height === 'auto'
  const contentW = padding.left + yLabelBand + gridW + padding.right
  const contentH =
    padding.top + gridH + (axes.x.show ? xLabelBand : 0) + colorLegendH + padding.bottom

  const sceneWidth = Math.max(layout.width, contentW)
  const fixedH = typeof layout.height === 'number' ? layout.height : contentH
  const sceneHeight = autoHeight ? contentH : Math.max(fixedH, contentH)

  const scene: SceneGraph = {
    width: sceneWidth,
    height: sceneHeight,
    background: surface.background,
    barRows: [],
    heatmapCells: [],
    heatmapColorLegend: null,
    groupTitles: [],
    axes: [],
    gridLines: [],
    legendItems: [],
    hits: [],
  }

  const gridLeft = padding.left + yLabelBand
  const gridTop = padding.top
  const plotW = gridW

  if (axes.y.show) {
    const ticks: AxisScene['ticks'] = []
    const rowLabelBoxW = rowLabelWidth
    const rowLabelBoxX = padding.left
    for (let ri = 0; ri < categoryCount; ri++) {
      const y = gridTop + ri * (cellH + gap) + cellH / 2
      const boxY = y - cellH / 2
      const lx = rowLabelBoxX + rowLabelBoxW + rowLabelOffsetX
      const ly = y + rowLabelOffsetY
      ticks.push({
        x1: lx,
        y1: ly,
        x2: lx,
        y2: ly,
        label: data.categories[ri] ?? '',
        fontSize: yFontSize,
        fontFamily: typography.fontFamily,
        lx,
        ly,
        textAlign: 'right',
        labelBox: { x: rowLabelBoxX, y: boxY, w: rowLabelBoxW, h: cellH },
      })
    }
    scene.axes.push({ kind: 'axis', orientation: 'vertical', ticks })
  }

  if (axes.x.show) {
    const ticks: AxisScene['ticks'] = []
    const bandTop = gridTop + gridH + labelGridGap
    const colLabelBoxH = columnLabelBandHeight
    for (let ci = 0; ci < seriesCount; ci++) {
      const cellLeft = gridLeft + ci * (cellW + gap)
      const x = cellLeft + cellW / 2
      const name = data.series[ci]?.name ?? ''
      const lx = x + columnLabelOffsetX
      const ly = bandTop + columnLabelOffsetY
      ticks.push({
        x1: lx,
        y1: ly,
        x2: lx,
        y2: ly,
        label: name,
        lx,
        ly,
        textAlign: 'left',
        labelRotation: Math.PI / 2,
        fontSize: xFontSize,
        fontFamily: typography.fontFamily,
        labelBox: {
          x: cellLeft + columnLabelOffsetX,
          y: bandTop + columnLabelOffsetY,
          w: cellW,
          h: colLabelBoxH,
        },
      })
    }
    scene.axes.push({ kind: 'axis', orientation: 'horizontal', ticks })
  }

  const staggerTotal = categoryCount * seriesCount
  const staggerMs = animation.stagger

  for (let ri = 0; ri < categoryCount; ri++) {
    for (let ci = 0; ci < seriesCount; ci++) {
      const value = data.series[ci]?.values[ri] ?? 0
      const x = gridLeft + ci * (cellW + gap)
      const y = gridTop + ri * (cellH + gap)
      const id = `hm-${ri}-${ci}`
      const state =
        selectId === id ? 'selected' : hoverId === id ? 'hover' : 'default'
      const fill = colorForHeatmapValue(value, domain, heatmapColors)
      const stroke = barStrokeForState(state, surface)
      const order = staggerIndex(ri, ci, categoryCount, seriesCount, animation.direction)
      const cellProgress = animation.enabled
        ? Math.max(
            0,
            Math.min(
              1,
              (animProgress * (animation.duration + staggerMs * staggerTotal) -
                order * staggerMs) /
                animation.duration,
            ),
          )
        : 1

      const cell: HeatmapCellScene = {
        kind: 'heatmapCell',
        id,
        x,
        y,
        width: cellW,
        height: cellH,
        fill,
        stroke,
        label: labels.show
          ? formatLabelTemplate(
              labels.template,
              value,
              data.categories[ri] ?? '',
              labels.valueFormat,
            )
          : '',
        labelColor: labelOnFillOverBackground(fill, surface.background),
        state,
        progress: cellProgress,
      }
      scene.heatmapCells.push(cell)
      scene.hits.push({
        id,
        kind: 'heatmapCell',
        x,
        y,
        width: cellW,
        height: cellH,
        meta: {
          category: data.categories[ri] ?? '',
          series: data.series[ci]?.name ?? '',
          value,
          row: ri,
          col: ci,
        },
      })
    }
  }

  if (legend.show && legend.position === 'bottom') {
    const legendW = Math.min(plotW, 280)
    const legendX = gridLeft + (plotW - legendW) / 2
    const legendY = gridTop + gridH + xLabelBand + 4
    const samples = sampleHeatmapLegend(heatmapColors, domain, 48)
    const minLabel = formatValue(domain.min, labels.valueFormat)
    const maxLabel = formatValue(domain.max, labels.valueFormat)
    scene.heatmapColorLegend = {
      kind: 'heatmapColorLegend',
      x: legendX,
      y: legendY,
      width: legendW,
      height: 10,
      minLabel,
      maxLabel,
      midLabel:
        heatmapColors.mode === 'diverging' ? formatValue(0, labels.valueFormat) : undefined,
      samples,
    }
  }

  return scene
}
