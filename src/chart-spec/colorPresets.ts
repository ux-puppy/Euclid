import type { ChartSurfaceColors, ColorTokens } from './types'

export const darkChartSurface: ChartSurfaceColors = {
  background: '#1a1a1a',
  text: 'rgba(255,255,255,0.5)',
  textSecondary: 'rgba(255,255,255,0.9)',
  axis: 'rgba(255,255,255,0.4)',
  grid: 'rgba(255,255,255,0.08)',
  hover: 'rgba(255,255,255,0.15)',
  selected: 'rgba(255,255,255,0.25)',
  tooltip: '#000000',
  border: 'rgba(255,255,255,0.12)',
  barHoverBorder: 'rgba(255,255,255,0.4)',
  barSelectedBorder: '#ffffff',
}

export const lightChartSurface: ChartSurfaceColors = {
  background: '#ffffff',
  text: 'rgba(0,0,0,0.5)',
  textSecondary: 'rgba(0,0,0,0.85)',
  axis: 'rgba(0,0,0,0.45)',
  grid: 'rgba(0,0,0,0.08)',
  hover: 'rgba(0,0,0,0.06)',
  selected: 'rgba(0,0,0,0.12)',
  tooltip: '#ffffff',
  border: 'rgba(0,0,0,0.1)',
  barHoverBorder: 'rgba(0,0,0,0.35)',
  barSelectedBorder: 'rgba(0,0,0,0.55)',
}

/** Legacy v1 full tokens for import migration only. */
export const legacyDarkSeries = [
  '#b8a9e8',
  '#f4a896',
  '#8fd4c8',
  '#e8d48f',
  '#d4a0b0',
  '#9ec5e8',
] as const

export const legacyDarkDepth = ['#6b5b95', '#9b8fc4', '#c4b8e0', '#e8e0f4'] as const

export const darkChartColors: ColorTokens = {
  ...darkChartSurface,
  series: [...legacyDarkSeries],
  depth: [...legacyDarkDepth],
}

export const lightChartColors: ColorTokens = {
  ...lightChartSurface,
  series: ['#8b7ec8', '#e8927a', '#5fb8a8', '#d4b86a', '#c07890', '#6aafd4'],
  depth: ['#5a4a82', '#7a6aa8', '#a898c8', '#d0c8e8'],
}

export function swapPresetSurface(
  current: ChartSurfaceColors,
  from: ChartSurfaceColors,
  to: ChartSurfaceColors,
): ChartSurfaceColors {
  const keys = Object.keys(from) as (keyof ChartSurfaceColors)[]
  const next = { ...current }
  for (const key of keys) {
    if (current[key] === from[key]) {
      next[key] = to[key]
    }
  }
  return next
}

/** @deprecated Use swapPresetSurface */
export function swapPresetColors(
  current: ColorTokens,
  from: ColorTokens,
  to: ColorTokens,
): ColorTokens {
  const surface = swapPresetSurface(current, from, to)
  return {
    ...surface,
    series: [...current.series],
    depth: [...current.depth],
  }
}
