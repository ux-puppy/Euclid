import { labelOnFill } from '../../accessibility/contrast'
import { resolveSurfaceForTheme } from '../../chart-spec/surfaceColors'
import type { BarChartSpec } from '../../chart-spec/types'
import { barLabelFields } from '../../data/format'
import { resolveVisualizationColors } from '../../visualization-colors/resolve'
import type { ChartTheme } from '../../visualization-colors/types'
import { flattenVisibleTree } from './flattenTree'
import { hierarchyRowAnimProgress, treeLayoutSectionProgress } from './treeRowAnim'
import type { SceneGraph } from './types'
import { barStrokeForState } from './barInteractionStyle'
import { isValueLerpActive, resolveBarWidth, type ValueAnimState } from './valueAnim'
import { attachBarValueColorLegend, barFillForValue } from './valueBarColors'
import { isBarValueColorEncoding } from '../../chart-spec/types'

function maxTabularValue(spec: BarChartSpec): number {
  if (spec.data.shape !== 'tabular') return 1
  return Math.max(...spec.data.series.flatMap((s) => s.values), 0.01)
}

function listRowMetrics(spec: BarChartSpec): {
  barThickness: number
  rowSlot: number
  rowStride: number
} {
  const fromGeometry = spec.geometry.barThickness
  if (spec.layout.mode !== 'list') {
    return {
      barThickness: fromGeometry,
      rowSlot: fromGeometry,
      rowStride: fromGeometry,
    }
  }
  const { rowGap } = spec.layout
  const barThickness = fromGeometry > 0 ? fromGeometry : 18
  const rowSlot = barThickness
  return {
    barThickness,
    rowSlot,
    rowStride: rowSlot + rowGap,
  }
}

function resolveSceneHeight(
  layoutHeight: number | 'auto',
  contentBottom: number,
): number {
  const contentH = contentBottom
  if (layoutHeight === 'auto') return contentH
  return Math.max(layoutHeight, contentH)
}

export function computeListLayout(
  spec: BarChartSpec,
  theme: ChartTheme,
  hoverId: string | null,
  selectId: string | null,
  expandedIds: readonly string[],
  collapsedIds: readonly string[],
  animProgress: number,
  animElapsedMs = 0,
  treeRevealAnimStart: number | null = null,
  treeRevealRowIds: readonly string[] = [],
  treeHideRowIds: readonly string[] = [],
  valueAnim?: ValueAnimState,
): SceneGraph {
  if (spec.layout.mode !== 'list') throw new Error('Expected list layout')

  const { layout, labels } = spec
  const surface = resolveSurfaceForTheme(spec.colors, theme)
  const valueColors = isBarValueColorEncoding(spec.colors)
  const viz = valueColors
    ? null
    : resolveVisualizationColors(spec.colors.visualization, spec, theme)
  const { barThickness, rowSlot, rowStride } = listRowMetrics(spec)
  const contentWidth = layout.width - layout.padding.left - layout.padding.right

  function barTrackWidth(indent: number): number {
    return Math.max(0, contentWidth - indent)
  }

  const scene: SceneGraph = {
    width: layout.width,
    height: typeof layout.height === 'number' ? layout.height : 400,
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

  let y = layout.padding.top
  const globalMax = maxTabularValue(spec)

  if (spec.data.shape === 'tabular') {
    const { categories, series } = spec.data
    categories.forEach((cat, gi) => {
      if (layout.groupTitle.show) {
        scene.groupTitles.push({
          kind: 'groupTitle',
          text: cat,
          x: layout.padding.left,
          y,
          fontSize: layout.groupTitle.fontSize,
        })
        y += layout.groupTitle.fontSize + 8
      }

      const groupMax =
        layout.valueScale === 'group'
          ? Math.max(...series.map((s) => s.values[gi] ?? 0), 0.01)
          : globalMax

      series.forEach((s, si) => {
        const value = s.values[gi] ?? 0
        const barMaxW = barTrackWidth(0)
        const id = `break-${gi}-${s.id}`
        const targetW = (value / groupMax) * barMaxW
        const loadP = isValueLerpActive(valueAnim) ? 1 : animProgress
        const barW = resolveBarWidth(id, targetW, loadP, valueAnim)
        const state =
          selectId === id ? 'selected' : hoverId === id ? 'hover' : 'default'
        const fill = valueColors ? barFillForValue(spec, value) : viz!.colorForSeriesIndex(si)

        const rowY = y
        const barY = rowY + (rowSlot - barThickness) / 2
        const barX = layout.padding.left
        const labelFields = barLabelFields(
          labels.template,
          value,
          s.name,
          labels.valueFormat,
        )

        scene.barRows.push({
          kind: 'barRow',
          id,
          x: layout.padding.left,
          y: barY,
          width: contentWidth,
          height: barThickness,
          barX,
          barWidth: barW,
          fill,
          stroke: barStrokeForState(state, surface),
          label: labels.show ? labelFields.label : '',
          labelX: barX + labels.insetX,
          labelValueText: labels.show ? labelFields.valueText : undefined,
          labelNameText: labels.show ? labelFields.nameText : undefined,
          labelColor: valueColors ? labelOnFill(fill) : undefined,
          state,
          progress: animProgress,
        })

        scene.hits.push({
          id,
          kind: 'bar',
          x: layout.padding.left,
          y: rowY,
          width: contentWidth,
          height: rowStride,
          meta: { group: cat, series: s.name, value },
        })

        y += rowStride
      })

      y += layout.groupGap
    })

    scene.height = resolveSceneHeight(layout.height, y + layout.padding.bottom)
    if (valueColors && spec.legend.show && spec.legend.position === 'bottom') {
      const legendW = Math.min(contentWidth, 280)
      attachBarValueColorLegend(
        scene,
        spec,
        layout.padding.left + (contentWidth - legendW) / 2,
        scene.height - layout.padding.bottom - spec.legend.fontSize - 14,
        legendW,
      )
    }
    return scene
  }

  const rows = flattenVisibleTree(
    spec.data.root,
    expandedIds,
    collapsedIds,
    spec.data.defaultExpandedDepth,
  )

  const treeGlobalMax = Math.max(...rows.map((r) => r.value), 0.01)

  const slotTops: number[] = []
  let slotCursor = layout.padding.top
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]!.depth === 0 && i > 0) slotCursor += layout.groupGap
    slotTops.push(slotCursor)
    slotCursor += rowStride
  }

  type RowIndexRange = { start: number; end: number }
  function contiguousRowGroups(activeIds: readonly string[]): RowIndexRange[] {
    const active = new Set(activeIds)
    const groups: RowIndexRange[] = []
    let i = 0
    while (i < rows.length) {
      if (!active.has(rows[i]!.id)) {
        i++
        continue
      }
      const start = i
      while (i < rows.length && active.has(rows[i]!.id)) i++
      groups.push({ start, end: i - 1 })
    }
    return groups
  }

  const hierarchyLayoutAnim =
    spec.variant === 'hierarchy' &&
    spec.animation.enabled &&
    treeRevealAnimStart != null &&
    (treeRevealRowIds.length > 0 || treeHideRowIds.length > 0)

  const revealing = treeRevealRowIds.length > 0
  const sectionProgress = hierarchyLayoutAnim
    ? treeLayoutSectionProgress(spec, treeRevealAnimStart)
    : 1

  const sectionGroups = hierarchyLayoutAnim
    ? contiguousRowGroups(revealing ? treeRevealRowIds : treeHideRowIds)
    : []

  type SectionGroupAnim = {
    start: number
    end: number
    blockTop: number
    fullHeight: number
    visibleHeight: number
    shrinkBelow: number
  }

  const sectionAnims: SectionGroupAnim[] = sectionGroups.map(({ start, end }) => {
    const fullHeight = (end - start + 1) * rowStride
    const blockTop = slotTops[start]!
    const visibleFraction = revealing ? sectionProgress : 1 - sectionProgress
    const visibleHeight = fullHeight * visibleFraction
    return {
      start,
      end,
      blockTop,
      fullHeight,
      visibleHeight,
      shrinkBelow: fullHeight - visibleHeight,
    }
  })

  function shrinkBelowRow(rowIndex: number): number {
    let shrink = 0
    for (const g of sectionAnims) {
      if (rowIndex > g.end) shrink += g.shrinkBelow
    }
    return shrink
  }

  function sectionForRow(rowIndex: number): SectionGroupAnim | null {
    for (const g of sectionAnims) {
      if (rowIndex >= g.start && rowIndex <= g.end) return g
    }
    return null
  }

  rows.forEach((row, rowIndex) => {
    const rowAnim =
      spec.variant === 'hierarchy'
        ? hierarchyRowAnimProgress(
            spec,
            row.id,
            rowIndex,
            animElapsedMs,
            treeRevealAnimStart,
            treeRevealRowIds,
          )
        : animProgress

    const indent = row.depth * layout.indentPerLevel
    const barMaxW = barTrackWidth(indent)
    let scaleMax = treeGlobalMax
    if (layout.valueScale === 'parent' && row.parentId) {
      const parent = rows.find((r) => r.id === row.parentId)
      scaleMax = parent?.value ?? treeGlobalMax
    }
    const id = row.id
    const inSectionAnim =
      hierarchyLayoutAnim &&
      (treeRevealRowIds.includes(id) || treeHideRowIds.includes(id))
    const targetW = (row.value / Math.max(scaleMax, 0.01)) * barMaxW
    const loadP = isValueLerpActive(valueAnim) ? 1 : inSectionAnim ? 1 : rowAnim
    const barW = resolveBarWidth(id, targetW, loadP, valueAnim)
    const state =
      selectId === id ? 'selected' : hoverId === id ? 'hover' : 'default'
    const fill = valueColors
      ? barFillForValue(spec, row.value)
      : row.color ??
        viz!.colorForTreeRow({
          depth: row.depth,
          depthInBranch: row.depthInBranch,
          branchRootId: row.branchRootId,
        })

    const rowY = slotTops[rowIndex]! - shrinkBelowRow(rowIndex)
    const barY = rowY + (rowSlot - barThickness) / 2
    const barX = layout.padding.left + indent

    const section = sectionForRow(rowIndex)
    const useSectionClip =
      section != null && section.visibleHeight < section.fullHeight - 0.5
    const labelFields = labels.show
      ? barLabelFields(labels.template, row.value, row.label, labels.valueFormat)
      : null

    scene.barRows.push({
      kind: 'barRow',
      id,
      x: layout.padding.left,
      y: barY,
      width: contentWidth,
      height: barThickness,
      slotTop: rowY,
      revealClipTop: useSectionClip ? section.blockTop : undefined,
      revealClipHeight: useSectionClip ? section.visibleHeight : undefined,
      rowStride,
      barX,
      barWidth: barW,
      fill,
      stroke: barStrokeForState(state, surface),
      label: labelFields?.label ?? '',
      labelX: barX + labels.insetX,
      labelValueText: labelFields?.valueText,
      labelNameText: labelFields?.nameText,
      labelColor: valueColors ? labelOnFill(fill) : undefined,
      depth: row.depth,
      hasChildren: row.hasChildren,
      expanded: row.expanded,
      state,
      progress: rowAnim,
    })

    const hitH =
      section != null
        ? Math.max(0, Math.min(rowY + rowStride, section.blockTop + section.visibleHeight) - rowY)
        : rowStride

    if (hitH > 0.5) {
      scene.hits.push({
        id,
        kind: 'bar',
        x: layout.padding.left,
        y: rowY,
        width: contentWidth,
        height: hitH,
        meta: { nodeId: id, hasChildren: row.hasChildren },
      })
    }
  })

  const totalShrink = sectionAnims.reduce((s, g) => s + g.shrinkBelow, 0)
  const contentBottom =
    rows.length > 0 ? slotCursor - totalShrink : layout.padding.top

  scene.height = resolveSceneHeight(layout.height, contentBottom + layout.padding.bottom)
  if (valueColors && spec.legend.show && spec.legend.position === 'bottom') {
    const legendW = Math.min(contentWidth, 280)
    attachBarValueColorLegend(
      scene,
      spec,
      layout.padding.left + (contentWidth - legendW) / 2,
      scene.height - layout.padding.bottom - spec.legend.fontSize - 14,
      legendW,
    )
  }
  return scene
}
