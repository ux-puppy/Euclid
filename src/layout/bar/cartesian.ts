import { scaleLinear } from 'd3-scale'
import { resolveSurfaceForTheme } from '../../chart-spec/surfaceColors'
import type { ChartSpec } from '../../chart-spec/types'
import { barLabelFields, formatValue } from '../../data/format'
import { resolveVisualizationColors } from '../../visualization-colors/resolve'
import type { ChartTheme } from '../../visualization-colors/types'
import type { AxisScene, SceneGraph } from './types'
import { barStrokeForState } from './barInteractionStyle'
import { isValueLerpActive, resolveBarWidth, type ValueAnimState } from './valueAnim'

export function computeCartesianLayout(
  spec: ChartSpec,
  theme: ChartTheme,
  hoverId: string | null,
  selectId: string | null,
  animProgress: number,
  valueAnim?: ValueAnimState,
): SceneGraph {
  if (spec.data.shape !== 'tabular' || spec.layout.mode !== 'cartesian') {
    throw new Error('Invalid cartesian layout input')
  }

  const { layout, data, labels, axes, grid, legend, geometry } = spec
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const viz = resolveVisualizationColors(spec.colors.visualization, spec, theme)
  const { width, height, padding, barLayout } = layout
  const plotW = width - padding.left - padding.right
  const legendBottomReserve =
    legend.show && legend.position === 'bottom' ? legend.fontSize + 20 : 0
  const axisBand = axes.x.show ? 28 : 0
  const autoHeight = height === 'auto'

  const barThickness = geometry.barThickness
  const barGap = geometry.barGap
  const groupGap = geometry.groupGap
  const seriesCount = data.series.length

  const groupedBlockHeight =
    barLayout === 'grouped'
      ? barThickness * seriesCount + barGap * Math.max(0, seriesCount - 1)
      : barThickness

  const categoryCount = data.categories.length
  const totalCategoriesHeight =
    groupedBlockHeight * categoryCount + groupGap * Math.max(0, categoryCount - 1)

  const plotH = autoHeight
    ? totalCategoriesHeight
    : height - padding.top - padding.bottom - legendBottomReserve

  const allValues = data.series.flatMap((s) => s.values)
  const minV = Math.min(0, ...allValues)
  const maxV = Math.max(...allValues, 0.01)

  const valueScale = scaleLinear().domain([minV, maxV]).nice().range([0, plotW])

  const sceneHeight = autoHeight
    ? padding.top + totalCategoriesHeight + axisBand + legendBottomReserve + padding.bottom
    : height

  const scene: SceneGraph = {
    width,
    height: sceneHeight,
    background: surface.background,
    barRows: [],
    groupTitles: [],
    axes: [],
    gridLines: [],
    legendItems: [],
    hits: [],
  }

  if (grid.show) {
    const ticks = valueScale.ticks(axes.y.tickCount)
    for (const t of ticks) {
      const pos = valueScale(t)! + padding.left
      scene.gridLines.push({
        kind: 'gridLine',
        x1: pos,
        y1: padding.top,
        x2: pos,
        y2: padding.top + plotH,
      })
    }
  }

  const axisTicks: AxisScene['ticks'] = []
  const valueTicks = valueScale.ticks(axes.y.tickCount)
  const [domainMin] = valueScale.domain()
  const minTickX = valueScale(domainMin)!
  for (const t of valueTicks) {
    const pos = valueScale(t)!
    const x = padding.left + pos
    const isMinTick = Math.abs(pos - minTickX) < 0.5
    axisTicks.push({
      x1: x,
      y1: padding.top + plotH,
      x2: x,
      y2: padding.top + plotH + 4,
      label: formatValue(t, labels.valueFormat),
      lx: isMinTick ? x + 4 : x,
      ly: padding.top + plotH + 16,
      textAlign: isMinTick ? 'left' : 'right',
    })
  }
  scene.axes.push({
    kind: 'axis',
    orientation: 'horizontal',
    ticks: axisTicks,
  })

  let yCursor =
    padding.top + (autoHeight ? 0 : Math.max(0, (plotH - totalCategoriesHeight) / 2))

  data.categories.forEach((cat, ci) => {
    const blockTop = yCursor

    data.series.forEach((series, si) => {
      const raw = series.values[ci] ?? 0
      let drawValue = raw
      if (barLayout === 'stacked') {
        drawValue = data.series.slice(0, si + 1).reduce((s, ser) => s + (ser.values[ci] ?? 0), 0)
      }
      const v0 =
        barLayout === 'stacked' && si > 0
          ? data.series.slice(0, si).reduce((s, ser) => s + (ser.values[ci] ?? 0), 0)
          : 0

      let y: number
      let bh: number
      if (barLayout === 'grouped') {
        y = blockTop + si * (barThickness + barGap)
        bh = barThickness
      } else {
        y = blockTop
        bh = barThickness
      }

      const x0 = valueScale(v0)!
      const x1 = valueScale(drawValue)!
      const bw = Math.abs(x1 - x0)
      const x = Math.min(x0, x1) + padding.left

      const id = `${series.id}-${ci}`
      const state = selectId === id ? 'selected' : hoverId === id ? 'hover' : 'default'
      const fill = viz.colorForSeriesIndex(si)

      const loadP = isValueLerpActive(valueAnim) ? 1 : animProgress
      const animatedBw = resolveBarWidth(id, bw, loadP, valueAnim)
      const labelFields = labels.show
        ? barLabelFields(labels.template, raw, series.name, labels.valueFormat)
        : null

      scene.barRows.push({
        kind: 'barRow',
        id,
        x,
        y,
        width: animatedBw,
        height: bh,
        barX: x,
        barWidth: animatedBw,
        fill,
        stroke: barStrokeForState(state, surface),
        label: labelFields?.label ?? '',
        labelX: x + labels.insetX,
        labelValueText: labelFields?.valueText,
        labelNameText: labelFields?.nameText,
        state,
        progress: animProgress,
      })

      scene.hits.push({
        id,
        kind: 'bar',
        x,
        y,
        width: animatedBw,
        height: bh,
        meta: { category: cat, series: series.name, value: raw },
      })
    })

    yCursor += groupedBlockHeight + groupGap
  })

  if (legend.show) {
    const startY = padding.top + plotH + 10
    data.series.forEach((s, i) => {
      scene.legendItems.push({
        kind: 'legendItem',
        id: s.id,
        x: padding.left + i * 90,
        y: startY,
        color: viz.colorForSeriesIndex(i),
        label: s.name,
      })
    })
  }

  return scene
}
