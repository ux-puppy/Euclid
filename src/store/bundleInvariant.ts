import type { BarChartSpec, ChartSpec, ChartVariant, EditorChartId } from '../chart-spec/types'
import { isBarChartSpec } from '../chart-spec/types'

const ALL_VARIANTS: ChartVariant[] = ['classic', 'breakdown', 'hierarchy']

export function assertBundleInvariant(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: ChartSpec
  selectedChart: EditorChartId
}) {
  if (!import.meta.env.DEV) return
  if (state.selectedChart === 'palette') return
  const slot =
    state.selectedChart === 'heatmap'
      ? state.heatmapSpec
      : state.specsByVariant[state.selectedChart]
  if (state.spec !== slot) {
    console.warn(
      `[euclid] spec is not the same reference as active slot (${state.selectedChart})`,
    )
  }
  for (const variant of ALL_VARIANTS) {
    const bar = state.specsByVariant[variant]
    if (bar.variant !== variant) {
      console.warn(
        `[euclid] specsByVariant[${variant}].variant is "${bar.variant}"`,
      )
    }
    if (bar.chartType !== 'bar') {
      console.warn(`[euclid] specsByVariant[${variant}] is not a bar chart`)
    }
  }
  if (state.heatmapSpec.chartType !== 'heatmap') {
    console.warn('[euclid] heatmapSpec is not a heatmap chart')
  }
  if (isBarChartSpec(state.spec) && state.selectedChart === 'heatmap') {
    console.warn('[euclid] selectedChart is heatmap but spec is bar')
  }
}
