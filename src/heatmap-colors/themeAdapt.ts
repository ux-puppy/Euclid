import type { ChartTheme } from '../visualization-colors/types'
import { oklchColorAt, oklchFromHex, oklchToHex } from '../visualization-colors/oklch'
import { attachAlpha, readColorAlpha } from './colorAlpha'
import { DEFAULT_HEATMAP_COLORS } from './defaults'
import type { HeatmapColorConfig, HeatmapGradient } from './types'

const CHROMA_EPS = 1e-6

/** Stored gradient stops are canonical at default light-mode slider values. */
const CANONICAL_THEME_LC = DEFAULT_HEATMAP_COLORS.lightMode

function themeDelta(config: HeatmapColorConfig, theme: ChartTheme): { dL: number; cScale: number } {
  const refC = Math.max(CANONICAL_THEME_LC.chroma, CHROMA_EPS)
  const active = theme === 'light' ? config.lightMode : config.darkMode
  return {
    dL: active.lightness - CANONICAL_THEME_LC.lightness,
    cScale: active.chroma / refC,
  }
}

function isThemeIdentity(config: HeatmapColorConfig, theme: ChartTheme): boolean {
  const { dL, cScale } = themeDelta(config, theme)
  return Math.abs(dL) < 1e-9 && Math.abs(cScale - 1) < 1e-9
}

function usesAdaptInversion(config: HeatmapColorConfig, theme: ChartTheme): boolean {
  return theme === 'dark' && config.adaptInversion !== false
}

function needsThemeAdapt(config: HeatmapColorConfig, theme: ChartTheme): boolean {
  if (!isThemeIdentity(config, theme)) return true
  return usesAdaptInversion(config, theme)
}

/** Reflect stored (light-canonical) L so dark UI preserves relative emphasis. */
function invertCanonicalLightness(l: number): number {
  return 2 * CANONICAL_THEME_LC.lightness - l
}

function canonicalLightnessFromThemed(lThemed: number, config: HeatmapColorConfig, theme: ChartTheme): number {
  return usesAdaptInversion(config, theme) ? invertCanonicalLightness(lThemed) : lThemed
}

function transformOklch(
  l: number,
  c: number,
  h: number,
  dL: number,
  cScale: number,
  alpha: number,
): string {
  const next = oklchColorAt(
    Math.min(0.98, Math.max(0.05, l + dL)),
    Math.min(0.4, Math.max(0, c * cScale)),
    h,
  )
  return attachAlpha(oklchToHex(next.l, next.c, next.h), alpha)
}

/** Apply theme lightness/chroma delta to a stored (light-canonical) hex. */
export function transformHeatmapHex(
  hex: string,
  config: HeatmapColorConfig,
  theme: ChartTheme,
): string {
  const alpha = readColorAlpha(hex)
  const ok = oklchFromHex(hex)
  if (!ok) return hex
  const { dL, cScale } = themeDelta(config, theme)
  const l = usesAdaptInversion(config, theme) ? invertCanonicalLightness(ok.l) : ok.l
  return transformOklch(l, ok.c, ok.h, dL, cScale, alpha)
}

/** Undo theme delta so a picked display color is stored as light-canonical hex. */
export function canonicalHeatmapHex(
  hex: string,
  config: HeatmapColorConfig,
  theme: ChartTheme,
): string {
  const alpha = readColorAlpha(hex)
  const ok = oklchFromHex(hex)
  if (!ok) return hex
  const { dL, cScale } = themeDelta(config, theme)
  const invScale = cScale > CHROMA_EPS ? 1 / cScale : 1
  const preInvert = oklchColorAt(
    Math.min(0.98, Math.max(0.05, ok.l - dL)),
    Math.min(0.4, Math.max(0, ok.c * invScale)),
    ok.h,
  )
  const lCanon = canonicalLightnessFromThemed(preInvert.l, config, theme)
  const final = oklchColorAt(
    Math.min(0.98, Math.max(0.05, lCanon)),
    preInvert.c,
    ok.h,
  )
  return attachAlpha(oklchToHex(final.l, final.c, final.h), alpha)
}

export function themeAdaptGradient(
  gradient: HeatmapGradient,
  config: HeatmapColorConfig,
  theme: ChartTheme,
): HeatmapGradient {
  if (!needsThemeAdapt(config, theme)) return gradient
  return mapGradient(gradient, config, theme)
}

function mapGradient(
  gradient: HeatmapGradient,
  config: HeatmapColorConfig,
  theme: ChartTheme,
): HeatmapGradient {
  return {
    stops: gradient.stops.map((s) => ({
      ...s,
      color: transformHeatmapHex(s.color, config, theme),
    })),
  }
}

/** Clone config with all stop colors transformed for the active UI theme. */
export function applyHeatmapTheme(
  config: HeatmapColorConfig,
  theme: ChartTheme,
): HeatmapColorConfig {
  if (!needsThemeAdapt(config, theme)) return config
  return {
    ...config,
    sequential: mapGradient(config.sequential, config, theme),
    negative: mapGradient(config.negative, config, theme),
    positive: mapGradient(config.positive, config, theme),
    divergingZero: transformHeatmapHex(config.divergingZero, config, theme),
  }
}
