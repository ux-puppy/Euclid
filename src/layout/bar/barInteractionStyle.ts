import type { ChartSurfaceColors } from '../../chart-spec/types'

export function barStrokeForState(
  state: 'default' | 'hover' | 'selected',
  surface: ChartSurfaceColors,
): string {
  if (state === 'selected') return surface.barSelectedBorder
  if (state === 'hover') return surface.barHoverBorder
  return surface.border
}
