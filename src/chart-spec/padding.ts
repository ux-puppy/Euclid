import type { ChartSpec, Padding } from './types'

export function uniformPadding(value: number): Padding {
  return { top: value, right: value, bottom: value, left: value }
}

/** Applies the same padding to preview inset (`chartPadding`) and layout padding. */
export function applyUniformChartPadding(spec: ChartSpec, value: number): void {
  spec.chartPadding = value
  spec.layout.padding = uniformPadding(value)
}

export function normalizeChartPadding(spec: ChartSpec): ChartSpec {
  const value = spec.chartPadding ?? spec.layout.padding.top ?? 24
  applyUniformChartPadding(spec, value)
  if (typeof spec.containerCornerRadius !== 'number') {
    spec.containerCornerRadius = 12
  }
  if (typeof spec.labels.insetX !== 'number') spec.labels.insetX = 8
  if (typeof spec.labels.valueLabelGap !== 'number') spec.labels.valueLabelGap = 6
  if (typeof spec.labels.valueColumnWidth !== 'number') spec.labels.valueColumnWidth = 52
  if (!spec.labels.valueFontFamily) spec.labels.valueFontFamily = 'DM Mono'
  return spec
}
