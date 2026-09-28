import type { ChartSpec } from './types'
import { applyUniformChartPadding } from './padding'
import { cloneSurfaceByTheme } from './surfaceColors'

/** Settings shared across classic / breakdown / hierarchy variants. */
export type SharedChartSettings = Pick<
  ChartSpec,
  | 'chartPadding'
  | 'containerCornerRadius'
  | 'typography'
  | 'colors'
  | 'geometry'
  | 'labels'
  | 'axes'
  | 'grid'
  | 'legend'
  | 'tooltip'
  | 'interaction'
  | 'animation'
  | 'renderer'
>

export function pickSharedChartSettings(spec: ChartSpec): SharedChartSettings {
  return {
    chartPadding: spec.chartPadding,
    containerCornerRadius: spec.containerCornerRadius,
    typography: { ...spec.typography },
    colors: {
      surfaceByTheme: cloneSurfaceByTheme(spec.colors.surfaceByTheme),
      visualization: {
        ...spec.colors.visualization,
        base: { ...spec.colors.visualization.base },
        lightMode: { ...spec.colors.visualization.lightMode },
        darkMode: { ...spec.colors.visualization.darkMode },
        distanceWeights: { ...spec.colors.visualization.distanceWeights },
        variation: { ...spec.colors.visualization.variation },
        assignments: spec.colors.visualization.assignments
          ? { ...spec.colors.visualization.assignments }
          : {},
      },
    },
    geometry: { ...spec.geometry },
    labels: {
      ...spec.labels,
      valueFontFamily: spec.labels.valueFontFamily,
      valueFormat: { ...spec.labels.valueFormat },
    },
    axes: {
      x: { ...spec.axes.x },
      y: { ...spec.axes.y },
    },
    grid: { ...spec.grid, dash: [...spec.grid.dash] },
    legend: { ...spec.legend },
    tooltip: { ...spec.tooltip },
    interaction: { ...spec.interaction },
    animation: {
      ...spec.animation,
      customBezier: [...spec.animation.customBezier] as [
        number,
        number,
        number,
        number,
      ],
    },
    renderer: { ...spec.renderer },
  }
}

export function applySharedChartSettings(spec: ChartSpec, shared: SharedChartSettings): void {
  spec.chartPadding = shared.chartPadding
  spec.containerCornerRadius = shared.containerCornerRadius
  spec.typography = { ...shared.typography }
  spec.colors = {
    surfaceByTheme: cloneSurfaceByTheme(shared.colors.surfaceByTheme),
    visualization: {
      ...shared.colors.visualization,
      base: { ...shared.colors.visualization.base },
      lightMode: { ...shared.colors.visualization.lightMode },
      darkMode: { ...shared.colors.visualization.darkMode },
      distanceWeights: { ...shared.colors.visualization.distanceWeights },
      variation: { ...shared.colors.visualization.variation },
      assignments: shared.colors.visualization.assignments
        ? { ...shared.colors.visualization.assignments }
        : {},
    },
  }
  spec.geometry = { ...shared.geometry }
  spec.labels = {
    ...shared.labels,
    valueFormat: { ...shared.labels.valueFormat },
  }
  spec.axes = {
    x: { ...shared.axes.x },
    y: { ...shared.axes.y },
  }
  spec.grid = { ...shared.grid, dash: [...shared.grid.dash] }
  spec.legend = { ...shared.legend }
  spec.tooltip = { ...shared.tooltip }
  spec.interaction = { ...shared.interaction }
  spec.animation = {
    ...shared.animation,
    customBezier: [...shared.animation.customBezier] as [
      number,
      number,
      number,
      number,
    ],
  }
  spec.renderer = { ...shared.renderer }
  applyUniformChartPadding(spec, spec.chartPadding)
}
