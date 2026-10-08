import { normalizeHeatmapColors } from '../heatmap-colors/defaults'
import type {
  BarChartSpec,
  ChartSpec,
  HeatmapChartSpec,
  SharedChartSpecBody,
} from './types'
import { applyUniformChartPadding } from './padding'
import { cloneSurfaceByTheme } from './surfaceColors'

/** Non-color settings shared across bar variants (and heatmap body fields). */
export type SharedChartBody = Pick<
  SharedChartSpecBody,
  | 'chartPadding'
  | 'containerCornerRadius'
  | 'typography'
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

/** Settings shared across classic / breakdown / hierarchy bar variants. */
export type SharedBarChartSettings = SharedChartBody & {
  colors: BarChartSpec['colors']
}

export type SharedHeatmapChartSettings = SharedChartBody & {
  colors: HeatmapChartSpec['colors']
}

function pickSharedBody(spec: ChartSpec): SharedChartBody {
  return {
    chartPadding: spec.chartPadding,
    containerCornerRadius: spec.containerCornerRadius,
    typography: { ...spec.typography },
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

function applySharedBody(spec: ChartSpec, shared: SharedChartBody): void {
  spec.chartPadding = shared.chartPadding
  spec.containerCornerRadius = shared.containerCornerRadius
  spec.typography = { ...shared.typography }
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
  spec.tooltip = { ...spec.tooltip }
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
  spec.renderer = { ...spec.renderer }
  applyUniformChartPadding(spec, spec.chartPadding)
}

export function pickSharedChartSettings(spec: BarChartSpec): SharedBarChartSettings {
  return {
    ...pickSharedBody(spec),
    colors: {
      surfaceByTheme: cloneSurfaceByTheme(spec.colors.surfaceByTheme),
      encoding: spec.colors.encoding,
      heatmap: normalizeHeatmapColors(spec.colors.heatmap),
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
        accessibility: spec.colors.visualization.accessibility
          ? { ...spec.colors.visualization.accessibility }
          : undefined,
      },
    },
  }
}

export function applySharedChartSettings(spec: BarChartSpec, shared: SharedBarChartSettings): void {
  applySharedBody(spec, shared)
  spec.colors = {
    surfaceByTheme: cloneSurfaceByTheme(shared.colors.surfaceByTheme),
    encoding: shared.colors.encoding,
    heatmap: normalizeHeatmapColors(shared.colors.heatmap),
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
      accessibility: shared.colors.visualization.accessibility
        ? { ...shared.colors.visualization.accessibility }
        : undefined,
    },
  }
}

export function pickSharedHeatmapSettings(spec: HeatmapChartSpec): SharedHeatmapChartSettings {
  return {
    ...pickSharedBody(spec),
    colors: {
      surfaceByTheme: cloneSurfaceByTheme(spec.colors.surfaceByTheme),
      heatmap: normalizeHeatmapColors(spec.colors.heatmap),
    },
  }
}

export function applySharedHeatmapSettings(
  spec: HeatmapChartSpec,
  shared: SharedHeatmapChartSettings,
): void {
  applySharedBody(spec, shared)
  spec.colors = {
    surfaceByTheme: cloneSurfaceByTheme(shared.colors.surfaceByTheme),
    heatmap: normalizeHeatmapColors(shared.colors.heatmap),
  }
}

export function applySharedBodyToSpec(spec: ChartSpec, body: SharedChartBody): void {
  applySharedBody(spec, body)
}
