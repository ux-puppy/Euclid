import { resolveExcessColorHandling } from './defaults'
import type {
  BaseVisualizationColor,
  ChartTheme,
  ExcessColorMode,
  OklchColor,
  VariationDirection,
  VariationProperty,
  VisualizationPaletteConfig,
} from './types'
import { templateHueForPaletteSlot } from './paletteGenerator'
import { themedHexFromHue } from './perceptionColor'
import {
  hexFromOklchTuple,
  hexWithAlpha,
  normalizeHue,
  oklchColorAt,
  oklchFromHex,
} from './oklch'
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
  return themedHexFromHue(hue, config, theme)
}

function excessVariationProperty(
  mode: ExcessColorMode,
): 'lightness' | 'chroma' | 'hue' | null {
  if (mode === 'lightness' || mode === 'chroma' || mode === 'hue') return mode
  return null
}

function themedOklchFromSlotHue(
  slotHue: number,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): OklchColor {
  const hex = themedHexFromHue(slotHue, config, theme)
  const fromHex = oklchFromHex(hex)
  if (fromHex) return { l: fromHex.l, c: fromHex.c, h: fromHex.h }
  const { l, c } = themeLc(config, theme)
  return { l, c, h: slotHue }
}

/** Themed slot color (brightness/chroma) first, then excess shift / variation / opacity. */
export function hexFromBaseVisualizationColor(
  base: BaseVisualizationColor,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
  colorCount: number,
): string {
  const slot = base.paletteSlot ?? base.index
  const slotHue = templateHueForPaletteSlot(slot, config, colorCount)
  const level = base.excessLevel ?? 0

  if (level <= 0) {
    return themedHexFromHue(slotHue, config, theme)
  }

  const excess = resolveExcessColorHandling(config)
  let ok = themedOklchFromSlotHue(slotHue, config, theme)

  if (excess.mode === 'repeatWithShift') {
    ok = { ...ok, h: normalizeHue(ok.h + level * excess.shiftDegrees) }
  } else {
    const prop = excessVariationProperty(excess.mode)
    if (prop) {
      ok = applyVariation(ok, level, prop, excess.step, config.variation.direction)
    }
  }

  let hex = hexFromOklchTuple(ok)
  if (excess.opacityStep > 0) {
    hex = hexWithAlpha(
      hex,
      alphaForLevel(level, excess.opacityStep, config.variation.opacityDirection),
    )
  }
  return hex
}

export function applyVariation(
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

export function alphaForLevel(
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
