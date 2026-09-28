import { darkChartSurface, lightChartSurface } from './colorPresets'
import type { ChartColors, ChartSurfaceColors } from './types'
import type { ChartTheme } from '../visualization-colors/types'

/** Group titles / chrome use `text`; on-chart labels & legend use `textSecondary`. */
export function remapSurfaceTextRoles(surface: ChartSurfaceColors): ChartSurfaceColors {
  return {
    ...surface,
    textSecondary: surface.text,
    text: surface.textSecondary,
  }
}

export function resolveSurfaceForTheme(
  colors: ChartColors,
  theme: ChartTheme,
): ChartSurfaceColors {
  return colors.surfaceByTheme[theme]
}

export function cloneSurfaceByTheme(
  surfaceByTheme: ChartColors['surfaceByTheme'],
): ChartColors['surfaceByTheme'] {
  return {
    light: completeChartSurface(surfaceByTheme.light, lightChartSurface),
    dark: completeChartSurface(surfaceByTheme.dark, darkChartSurface),
  }
}

/** Fill in bar border tokens; legacy specs used `hover` / `selected` for bar fill. */
export function completeChartSurface(
  surface: Partial<ChartSurfaceColors>,
  preset: ChartSurfaceColors,
): ChartSurfaceColors {
  const raw = surface as Partial<ChartSurfaceColors> & {
    barHoverBorder?: string
    barSelectedBorder?: string
    hover?: string
    selected?: string
  }
  return {
    ...preset,
    ...surface,
    barHoverBorder: raw.barHoverBorder ?? raw.hover ?? preset.barHoverBorder,
    barSelectedBorder: raw.barSelectedBorder ?? raw.selected ?? preset.barSelectedBorder,
  }
}

type ColorsInput = {
  visualization: ChartColors['visualization']
  surface?: Partial<ChartSurfaceColors>
  surfaceByTheme?: {
    light: Partial<ChartSurfaceColors>
    dark: Partial<ChartSurfaceColors>
  }
}

export function normalizeChartColors(input: ColorsInput): ChartColors {
  if (input.surfaceByTheme?.light && input.surfaceByTheme?.dark) {
    return {
      surfaceByTheme: {
        light: completeChartSurface(input.surfaceByTheme.light, lightChartSurface),
        dark: completeChartSurface(input.surfaceByTheme.dark, darkChartSurface),
      },
      visualization: input.visualization,
    }
  }

  const legacy = input.surface ?? darkChartSurface
  const remapped = remapSurfaceTextRoles(completeChartSurface(legacy, darkChartSurface))
  return {
    surfaceByTheme: {
      light: completeChartSurface(remapped, lightChartSurface),
      dark: completeChartSurface(remapped, darkChartSurface),
    },
    visualization: input.visualization,
  }
}
