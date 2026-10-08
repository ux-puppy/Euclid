import { labelOnFill } from '../../accessibility/contrast'
import { resolveSurfaceForTheme } from '../../chart-spec/surfaceColors'
import type { HeatmapChartSpec } from '../../chart-spec/types'
import { formatLabelTemplate, formatValue } from '../../data/format'
import {
  colorForHeatmapValue,
  domainFromValues,
  sampleHeatmapLegend,
} from '../../heatmap-colors/resolve'
import type { ChartTheme } from '../../visualization-colors/types'
import { barStrokeForState } from '../bar/barInteractionStyle'
import type { AxisScene, HeatmapCellScene, SceneGraph } from '../bar/types'
import {
  measureTextWidth,
  wrapText,
  yAxisLabelMaxWidth,
} from './canvasMeasure'

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
  const heatmapColors = spec.colors.heatmap

  const cellW = Math.max(8, layout.cellWidth)
  const cellH = Math.max(8, layout.cellHeight)
  const gap = Math.max(0, layout.gap)
  const columnLabelOffsetX = layout.columnLabelOffsetX ?? 0
  const columnLabelOffsetY = layout.columnLabelOffsetY ?? 0
  const rowLabelOffsetX = layout.rowLabelOffsetX ?? 0
  const rowLabelOffsetY = layout.rowLabelOffsetY ?? 0

  const gridW =
    seriesCount * cellW + Math.max(0, seriesCount - 1) * gap
  const gridH =
    categoryCount * cellH + Math.max(0, categoryCount - 1) * gap

  const yFontSize = axes.y.fontSize
  const xFontSize = axes.x.fontSize
  const yFont = `${yFontSize}px ${typography.fontFamily}`
  const xFont = `${xFontSize}px ${typography.fontFamily}`
  const yLabelMaxW = yAxisLabelMaxWidth()

  let yLabelBand = 0
  const rowLabelLines: string[][] = []
  if (axes.y.show) {
    for (let ri = 0; ri < categoryCount; ri++) {
      const lines = wrapText(data.categories[ri] ?? '', yLabelMaxW, yFont)
      rowLabelLines.push(lines)
      const blockW = Math.max(...lines.map((l) => measureTextWidth(l, yFont)), 0)
      yLabelBand = Math.max(yLabelBand, blockW)
    }
    yLabelBand += 16 + Math.max(0, -rowLabelOffsetX)
  }

  let xLabelBand = 0
  const colLabelWidths: number[] = []
  if (axes.x.show) {
    for (let ci = 0; ci < seriesCount; ci++) {
      const name = data.series[ci]?.name ?? ''
      const w = measureTextWidth(name, xFont)
      colLabelWidths.push(w)
      xLabelBand = Math.max(xLabelBand, w)
    }
    xLabelBand += xFontSize + 20 + Math.max(0, columnLabelOffsetY)
  }

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
    for (let ri = 0; ri < categoryCount; ri++) {
      const y = gridTop + ri * (cellH + gap) + cellH / 2
      const lines = rowLabelLines[ri] ?? ['']
      const lx = padding.left + yLabelBand - 10 + rowLabelOffsetX
      const ly = y + rowLabelOffsetY
      ticks.push({
        x1: lx,
        y1: ly,
        x2: lx,
        y2: ly,
        label: lines.join(' '),
        labelLines: lines,
        lineHeight: yFontSize * 1.25,
        fontSize: yFontSize,
        fontFamily: typography.fontFamily,
        lx,
        ly,
        textAlign: 'right',
      })
    }
    scene.axes.push({ kind: 'axis', orientation: 'vertical', ticks })
  }

  if (axes.x.show) {
    const ticks: AxisScene['ticks'] = []
    const labelAnchorY = gridTop + gridH + 8 + columnLabelOffsetY
    for (let ci = 0; ci < seriesCount; ci++) {
      const x = gridLeft + ci * (cellW + gap) + cellW / 2
      const name = data.series[ci]?.name ?? ''
      const lx = x + columnLabelOffsetX
      const ly = labelAnchorY
      ticks.push({
        x1: lx,
        y1: ly,
        x2: lx,
        y2: ly,
        label: name,
        lx,
        ly,
        textAlign: 'right',
        labelRotation: -Math.PI / 2,
        fontSize: xFontSize,
        fontFamily: typography.fontFamily,
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
        labelColor: labelOnFill(fill),
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
