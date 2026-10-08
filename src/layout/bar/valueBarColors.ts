import { normalizeHeatmapColors } from '../../heatmap-colors/defaults'
import {
  colorForHeatmapValue,
  domainFromValues,
  sampleHeatmapLegend,
} from '../../heatmap-colors/resolve'
import type { BarChartSpec, DataNode } from '../../chart-spec/types'
import { isBarValueColorEncoding } from '../../chart-spec/types'
import { resolveCartesianTabularData } from '../../data/unifiedData'
import { formatValue } from '../../data/format'
import type { SceneGraph } from './types'

function collectBarValues(spec: BarChartSpec): number[] {
  if (spec.data.shape === 'tabular') {
    if (spec.layout.mode === 'cartesian' && spec.layout.barLayout === 'stacked') {
      return resolveCartesianTabularData(spec).series.flatMap((s) => s.values)
    }
    return spec.data.series.flatMap((s) => s.values)
  }
  const out: number[] = []
  const walk = (node: DataNode) => {
    out.push(node.value)
    node.children?.forEach(walk)
  }
  walk(spec.data.root)
  return out
}

export function barFillForValue(spec: BarChartSpec, value: number): string {
  const config = normalizeHeatmapColors(spec.colors.heatmap)
  const domain = domainFromValues(collectBarValues(spec))
  return colorForHeatmapValue(value, domain, config)
}

export function attachBarValueColorLegend(
  scene: SceneGraph,
  spec: BarChartSpec,
  legendX: number,
  legendY: number,
  legendW: number,
): void {
  if (!isBarValueColorEncoding(spec.colors) || !spec.legend.show) return

  const config = normalizeHeatmapColors(spec.colors.heatmap)
  const domain = domainFromValues(collectBarValues(spec))
  const samples = sampleHeatmapLegend(config, domain, 48)
  const minLabel = formatValue(domain.min, spec.labels.valueFormat)
  const maxLabel = formatValue(domain.max, spec.labels.valueFormat)

  scene.heatmapColorLegend = {
    kind: 'heatmapColorLegend',
    x: legendX,
    y: legendY,
    width: legendW,
    height: 10,
    minLabel,
    maxLabel,
    midLabel: config.mode === 'diverging' ? formatValue(0, spec.labels.valueFormat) : undefined,
    samples,
  }
}
