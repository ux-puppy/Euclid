import { MAX_PALETTE_BASE_COUNT } from './constants'
import { resolveBaseLc } from './baseCorrection'
import { resolveExcessColorHandling, resolveHueLayout } from './defaults'
import type { BaseCorrection } from './baseCorrection'
import type {
  BaseVisualizationColor,
  HueLayout,
  VisualizationPaletteConfig,
} from './types'
import {
  distanceOklch,
  hueDeltaDegrees,
  normalizeHue,
  oklchColorAt,
  type OklchTuple,
} from './oklch'
import { isStandardPerceptionBase } from './perceptionColor'

const HUE_LATTICE_STEPS = 360
const UNIT_WEIGHTS = { lightness: 1, chroma: 1, hue: 1 } as const

function latticeCandidates(l: number, c: number): OklchTuple[] {
  const out: OklchTuple[] = []
  for (let i = 0; i < HUE_LATTICE_STEPS; i++) {
    const h = (i * 360) / HUE_LATTICE_STEPS
    out.push(oklchColorAt(l, c, h))
  }
  return out
}

/** Equal spacing around the hue ring: 0°, 360/n, 2×360/n, … */
export function evenlySpacedTemplateHues(count: number, maxInSet: number): number[] {
  const cap = Math.min(Math.max(2, maxInSet), MAX_PALETTE_BASE_COUNT)
  const n = Math.min(Math.max(1, count), cap)
  return Array.from({ length: n }, (_, i) => normalizeHue((360 / n) * i))
}

function greedyTemplateHuesHueOnly(n: number): number[] {
  const chosen: number[] = [0]
  const chosenSet = new Set([0])

  while (chosen.length < n) {
    let bestIdx = -1
    let bestMinDist = -1
    for (let h = 0; h < HUE_LATTICE_STEPS; h++) {
      if (chosenSet.has(h)) continue
      let minDist = Infinity
      for (const pick of chosen) {
        minDist = Math.min(minDist, hueDeltaDegrees(h, pick) / 180)
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist
        bestIdx = h
      }
    }
    if (bestIdx < 0) break
    chosenSet.add(bestIdx)
    chosen.push(bestIdx)
  }

  return chosen.map((deg) => normalizeHue(deg))
}

function greedyTemplateHues(n: number, l: number, c: number): number[] {
  const candidates = latticeCandidates(l, c)
  const chosen: OklchTuple[] = [candidates[0]!]
  const chosenIndices = new Set([0])

  while (chosen.length < n) {
    let bestIdx = -1
    let bestMinDist = -1
    for (let ci = 0; ci < candidates.length; ci++) {
      if (chosenIndices.has(ci)) continue
      const cand = candidates[ci]!
      let minDist = Infinity
      for (const pick of chosen) {
        minDist = Math.min(minDist, distanceOklch(cand, pick, UNIT_WEIGHTS))
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist
        bestIdx = ci
      }
    }
    if (bestIdx < 0) break
    chosenIndices.add(bestIdx)
    chosen.push(candidates[bestIdx]!)
  }

  return chosen.map((t) => normalizeHue(t.h))
}

function baseTemplateHues(
  count: number,
  l: number,
  c: number,
  base: BaseCorrection,
  layout: HueLayout,
  maxInSet: number,
): number[] {
  const cap = Math.min(Math.max(2, maxInSet), MAX_PALETTE_BASE_COUNT)
  const n = Math.min(Math.max(1, count), cap)
  if (layout === 'even') return evenlySpacedTemplateHues(n, cap)
  return isStandardPerceptionBase(base)
    ? greedyTemplateHuesHueOnly(n)
    : greedyTemplateHues(n, l, c)
}

/** Apply inspector hue separation: compress toward first hue when below 1×. */
function applyHueSeparation(template: number[], hueSeparation: number): number[] {
  const n = template.length
  if (n <= 1) return template

  const sep = Math.min(1, Math.max(0.25, hueSeparation))
  if (sep >= 1) return template

  const compress = 0.55 + 0.45 * ((sep - 0.25) / 0.75)
  const origin = template[0]!
  return template.map((h) => {
    const delta = hueDeltaDegrees(origin, h)
    const forward = ((h - origin + 360) % 360) <= 180
    const signedDelta = forward ? delta : -delta
    return normalizeHue(origin + signedDelta * compress)
  })
}

export function generateTemplateHues(
  count: number,
  l: number,
  c: number,
  weights: VisualizationPaletteConfig['distanceWeights'],
  base: BaseCorrection,
  layout: HueLayout,
  maxInSet: number = 12,
): number[] {
  const template = baseTemplateHues(count, l, c, base, layout, maxInSet)
  return applyHueSeparation(template, weights.hue)
}

/** Template hue for a slot (no excess rotation). */
export function templateHueForPaletteSlot(
  slot: number,
  config: VisualizationPaletteConfig,
  activeCount: number,
): number {
  const excess = resolveExcessColorHandling(config)
  const { lightness, chroma } = resolveBaseLc(config.base)
  const layout = resolveHueLayout(config)

  if (!excess.enabled) {
    const n = Math.min(Math.max(1, activeCount), MAX_PALETTE_BASE_COUNT)
    const template = generateTemplateHues(
      n,
      lightness,
      chroma,
      config.distanceWeights,
      config.base,
      layout,
      n,
    )
    const baseHue = template[slot % template.length] ?? 0
    return normalizeHue(baseHue + config.startHue)
  }

  const maxInSet = excess.activateAfter
  const paletteSize = Math.min(Math.max(1, activeCount), maxInSet)
  const template = generateTemplateHues(
    paletteSize,
    lightness,
    chroma,
    config.distanceWeights,
    config.base,
    layout,
    maxInSet,
  )
  const baseHue = template[slot % template.length] ?? 0
  return normalizeHue(baseHue + config.startHue)
}

export function hueForPaletteIndex(
  index: number,
  config: VisualizationPaletteConfig,
  activeCount: number,
): number {
  const excess = resolveExcessColorHandling(config)
  const slot = excess.enabled ? index % excess.activateAfter : index
  const slotHue = templateHueForPaletteSlot(slot, config, activeCount)

  if (!excess.enabled) {
    return slotHue
  }

  const setIndex = Math.floor(index / excess.activateAfter)
  if (setIndex > 0 && excess.mode === 'repeatWithShift') {
    return normalizeHue(slotHue + setIndex * excess.shiftDegrees)
  }
  return slotHue
}

export function generateBaseColors(
  config: VisualizationPaletteConfig,
  count: number,
): BaseVisualizationColor[] {
  const n = Math.max(1, count)
  const colors: BaseVisualizationColor[] = []
  const { lightness, chroma } = resolveBaseLc(config.base)
  const excess = resolveExcessColorHandling(config)

  for (let i = 0; i < n; i++) {
    const h = hueForPaletteIndex(i, config, n)
    const useStandard = isStandardPerceptionBase(config.base)
    const ok = useStandard
      ? { l: lightness, c: chroma, h }
      : oklchColorAt(lightness, chroma, h)

    const paletteSlot = excess.enabled ? i % excess.activateAfter : i
    let excessLevel = 0
    if (excess.enabled) {
      excessLevel = Math.floor(i / excess.activateAfter)
    }

    colors.push({
      index: i,
      hue: h,
      lightness: ok.l,
      chroma: ok.c,
      oklch: { l: ok.l, c: ok.c, h },
      paletteSlot,
      excessLevel: excessLevel > 0 ? excessLevel : undefined,
    })
  }
  return colors
}
