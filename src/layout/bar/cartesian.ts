import { scaleLinear } from 'd3-scale'
import { labelOnFill } from '../../accessibility/contrast'
import { resolveSurfaceForTheme } from '../../chart-spec/surfaceColors'
import type { BarChartSpec } from '../../chart-spec/types'
import { resolveCartesianTabularData } from '../../data/unifiedData'
import { barLabelFields, formatValue } from '../../data/format'
import { resolveVisualizationColors } from '../../visualization-colors/resolve'
import type { ChartTheme } from '../../visualization-colors/types'
import type { AxisScene, SceneGraph } from './types'
import { barStrokeForState } from './barInteractionStyle'
import { isValueLerpActive, resolveBarWidth, type ValueAnimState } from './valueAnim'
import { attachBarValueColorLegend, barFillForValue } from './valueBarColors'
import { cartesianValueExtent } from './cartesianValueExtent'
import { layoutStackedSegments } from './stackedSegmentLayout'
import { isBarValueColorEncoding } from '../../chart-spec/types'

export function computeCartesianLayout(
  spec: BarChartSpec,
  theme: ChartTheme,
  hoverId: string | null,
  selectId: string | null,
  animProgress: number,
  valueAnim?: ValueAnimState,
): SceneGraph {
  if (spec.data.shape !== 'tabular' || spec.layout.mode !== 'cartesian') {
    throw new Error('Invalid cartesian layout input')
  }

  const { layout, labels, axes, grid, legend, geometry } = spec
  const data = resolveCartesianTabularData(spec)
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const valueColors = isBarValueColorEncoding(spec.colors)
  const viz = valueColors
    ? null
    : resolveVisualizationColors(spec.colors.visualization, spec, theme)
  const { width, height, padding, barLayout } = layout
  const plotW = width - padding.left - padding.right
  const legendBottomReserve =
    legend.show && legend.position === 'bottom' ? legend.fontSize + 20 : 0
  const axisBand = axes.x.show ? 28 : 0
  const autoHeight = height === 'auto'

  const barThickness = geometry.barThickness
  const barGap = geometry.barGap
  const stackGap = geometry.stackGap ?? 0
  const groupGap = geometry.groupGap
  const seriesCount = data.series.length

  const groupedBlockHeight =
    barLayout === 'grouped'
      ? barThickness * seriesCount + barGap * Math.max(0, seriesCount - 1)
      : barThickness

  const categoryCount = data.categories.length
  const stackedCategoryTitleExtra =
    barLayout === 'stacked' && categoryCount > 1 ? 13 + 4 : 0
  const stackedTitleBand = stackedCategoryTitleExtra * categoryCount
  const totalCategoriesHeight =
    groupedBlockHeight * categoryCount +
    groupGap * Math.max(0, categoryCount - 1) +
    stackedTitleBand

  const plotH = autoHeight
    ? totalCategoriesHeight
    : height - padding.top - padding.bottom - legendBottomReserve

  const [minV, maxV] = cartesianValueExtent(data, barLayout)

  // Exact data domain so the largest bar total reaches full plot width (no `.nice()` padding).
  const valueScale = scaleLinear().domain([minV, maxV]).range([0, plotW])

  const sceneHeight = autoHeight
    ? padding.top + totalCategoriesHeight + axisBand + legendBottomReserve + padding.bottom
    : height

  const scene: SceneGraph = {
    width,
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

  const showStackedCategoryTitles =
    barLayout === 'stacked' && data.categories.length > 1

  data.categories.forEach((cat, ci) => {
    let blockTop = yCursor
    if (showStackedCategoryTitles) {
      const titleSize = 13
      scene.groupTitles.push({
        kind: 'groupTitle',
        text: cat,
        x: padding.left,
        y: blockTop,
        fontSize: titleSize,
      })
      blockTop += titleSize + 4
    }

    const loadP = isValueLerpActive(valueAnim) ? 1 : animProgress

    const pushBarSegment = (
      series: (typeof data.series)[number],
      si: number,
      raw: number,
      x: number,
      animatedBw: number,
      y: number,
      bh: number,
    ) => {
      const id = `${series.id}-${ci}`
      const state = selectId === id ? 'selected' : hoverId === id ? 'hover' : 'default'
      const fill = valueColors ? barFillForValue(spec, raw) : viz!.colorForSeriesIndex(si)
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
        labelColor: valueColors ? labelOnFill(fill) : undefined,
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
    }

    if (barLayout === 'stacked') {
      const y = blockTop
      const bh = barThickness
      const segments = layoutStackedSegments(
        data,
        ci,
        valueScale,
        padding.left,
        stackGap,
        loadP,
        valueAnim,
      )
      for (const seg of segments) {
        const series = data.series[seg.seriesIndex]!
        pushBarSegment(series, seg.seriesIndex, seg.raw, seg.x, seg.width, y, bh)
      }
    } else {
      data.series.forEach((series, si) => {
        const raw = series.values[ci] ?? 0
        const y = blockTop + si * (barThickness + barGap)
        const bh = barThickness
        const x0 = valueScale(0)!
        const x1 = valueScale(raw)!
        const bw = Math.abs(x1 - x0)
        const x = Math.min(x0, x1) + padding.left
        const id = `${series.id}-${ci}`
        const animatedBw = resolveBarWidth(id, bw, loadP, valueAnim)
        pushBarSegment(series, si, raw, x, animatedBw, y, bh)
      })
    }

    yCursor += groupedBlockHeight + stackedCategoryTitleExtra + groupGap
  })

  if (legend.show) {
    const startY = padding.top + plotH + 10
    if (valueColors) {
      const legendW = Math.min(plotW, 280)
      attachBarValueColorLegend(
        scene,
        spec,
        padding.left + (plotW - legendW) / 2,
        startY,
        legendW,
      )
    } else {
      data.series.forEach((s, i) => {
        scene.legendItems.push({
          kind: 'legendItem',
          id: s.id,
          x: padding.left + i * 90,
          y: startY,
          color: viz!.colorForSeriesIndex(i),
          label: s.name,
        })
      })
    }
  }

  return scene
}
