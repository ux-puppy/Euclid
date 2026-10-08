import { converter, formatHex } from 'culori'
import type { BaseCorrection } from './baseCorrection'
import { normalizeHue, oklchToHex } from './oklch'
import type { ChartTheme, VisualizationPaletteConfig } from './types'

const toRgb = converter('rgb')

function themeLc(
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): { l: number; c: number } {
  const mode = theme === 'light' ? config.lightMode : config.darkMode
  return { l: mode.lightness, c: mode.chroma }
}

/** Map theme sliders to HSL (standard / non–gamut-mapped color math). */
export function standardHexFromHue(h: number, lightness: number, chroma: number): string {
  const s = Math.min(1, Math.max(0, chroma * 3.6))
  const l = Math.min(1, Math.max(0, lightness))
  const hex = formatHex({ mode: 'hsl', h: normalizeHue(h), s, l })
  return hex ?? '#808080'
}

export function perceptualHexFromHue(h: number, lightness: number, chroma: number): string {
  return oklchToHex(lightness, chroma, h)
}

function perceptionWeights(base: BaseCorrection): { lightness: number; chroma: number } {
  return {
    lightness: Math.min(1, Math.max(0, base.lightnessCorrection)),
    chroma: Math.min(1, Math.max(0, base.chromaCorrection)),
  }
}

function mixStandardPerceptual(
  h: number,
  lightness: number,
  chroma: number,
  base: BaseCorrection,
): string {
  const { lightness: tL, chroma: tC } = perceptionWeights(base)
  const standard = standardHexFromHue(h, lightness, chroma)
  if (tL <= 0 && tC <= 0) return standard
  const perceptual = perceptualHexFromHue(h, lightness, chroma)
  if (tL >= 1 && tC >= 1) return perceptual

  const w = (tL + tC) / 2
  const ra = toRgb(standard)
  const rb = toRgb(perceptual)
  const mixChannel = (a: number, b: number) => a + (b - a) * w
  if (!ra || !rb) return perceptual
  return (
    formatHex({
      mode: 'rgb',
      r: mixChannel(ra.r ?? 0, rb.r ?? 0),
      g: mixChannel(ra.g ?? 0, rb.g ?? 0),
      b: mixChannel(ra.b ?? 0, rb.b ?? 0),
    }) ?? perceptual
  )
}

export function themedHexFromHue(
  h: number,
  config: VisualizationPaletteConfig,
  theme: ChartTheme,
): string {
  const { l, c } = themeLc(config, theme)
  return mixStandardPerceptual(h, l, c, config.base)
}

export function isStandardPerceptionBase(base: BaseCorrection): boolean {
  const { lightness, chroma } = perceptionWeights(base)
  return lightness <= 0 && chroma <= 0
}
