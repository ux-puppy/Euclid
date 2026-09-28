import type {
  ChartTheme,
  OklchColor,
  VariationDirection,
  VariationProperty,
  VisualizationPaletteConfig,
} from './types'
import { hexFromOklchTuple, hexWithAlpha, normalizeHue, oklchColorAt } from './oklch'
import type { OpacityVariationDirection } from './types'

function themeLc(
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): { l: number; c: number } {
  const mode = theme === 'light' ? config.lightMode : config.darkMode
  return { l: mode.lightness, c: mode.chroma }
}

export function baseThemedHex(
  hue: number,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): string {
  const { l, c } = themeLc(config, theme)
  const ok = oklchColorAt(l, c, hue)
  return hexFromOklchTuple(ok)
}

function applyVariation(
  base: OklchColor,
  level: number,
  property: VariationProperty,
  step: number,
  direction: VariationDirection,
): OklchColor {
  const sign =
    direction === 'lighter' || direction === 'higherChroma' ? 1 : -1
  const delta = level * step * sign
  let { l, c, h } = base

  switch (property) {
    case 'lightness':
      l = Math.min(0.98, Math.max(0.05, l + delta))
      break
    case 'chroma':
      c = Math.min(0.4, Math.max(0, c + delta))
      break
    case 'hue':
      h = normalizeHue(h + delta)
      break
    case 'lightnessChroma':
      l = Math.min(0.98, Math.max(0.05, l + delta))
      c = Math.min(0.4, Math.max(0, c + delta * 0.5))
      break
  }

  const clamped = oklchColorAt(l, c, h)
  return { l: clamped.l, c: clamped.c, h: clamped.h }
}

function alphaForLevel(
  level: number,
  opacityStep: number,
  opacityDirection: OpacityVariationDirection,
): number {
  if (level <= 0 || opacityStep <= 0) return 1
  const sign = opacityDirection === 'decrease' ? -1 : 1
  return Math.min(1, Math.max(0.05, 1 + sign * level * opacityStep))
}

export function hierarchyLevelHex(
  baseHue: number,
  level: number,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): string {
  const { l, c } = themeLc(config, theme)
  const base: OklchColor = { l, c, h: baseHue }
  const { property, step, direction, opacityStep, opacityDirection } = config.variation
  const varied =
    level <= 0
      ? base
      : applyVariation(base, level, property, step, direction)
  const hex = hexFromOklchTuple(varied)
  const alpha = alphaForLevel(level, opacityStep, opacityDirection)
  return hexWithAlpha(hex, alpha)
}

export function depthLevelHex(
  level: number,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): string {
  return hierarchyLevelHex(config.startHue, level, config, theme)
}
