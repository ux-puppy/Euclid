import { resolveBaseLc } from './baseCorrection'
import type { BaseVisualizationColor, VisualizationPaletteConfig } from './types'
import { distanceOklch, normalizeHue, oklchColorAt, type OklchTuple } from './oklch'

const HUE_LATTICE_STEPS = 360

function latticeCandidates(l: number, c: number): OklchTuple[] {
  const out: OklchTuple[] = []
  for (let i = 0; i < HUE_LATTICE_STEPS; i++) {
    const h = (i * 360) / HUE_LATTICE_STEPS
    out.push(oklchColorAt(l, c, h))
  }
  return out
}

/** Greedy farthest-point hue selection; first pick is hue 0 (rotate later via startHue). */
export function generateTemplateHues(
  count: number,
  l: number,
  c: number,
  weights: VisualizationPaletteConfig['distanceWeights'],
): number[] {
  const n = Math.min(Math.max(1, count), 12)
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
        minDist = Math.min(minDist, distanceOklch(cand, pick, weights))
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

export function hueForPaletteIndex(
  index: number,
  config: Pick<
    VisualizationPaletteConfig,
    'startHue' | 'maxBaseColors' | 'base' | 'distanceWeights'
  >,
): number {
  const max = config.maxBaseColors
  const setIndex = Math.floor(index / max)
  const slot = index % max
  const { lightness, chroma } = resolveBaseLc(config.base)
  const template = generateTemplateHues(max, lightness, chroma, config.distanceWeights)
  const baseHue = template[slot] ?? 0
  const setRotation = setIndex * (360 / (2 * max))
  return normalizeHue(baseHue + config.startHue + setRotation)
}

export function generateBaseColors(
  config: VisualizationPaletteConfig,
  count: number,
): BaseVisualizationColor[] {
  const n = Math.max(1, count)
  const colors: BaseVisualizationColor[] = []
  const { lightness, chroma } = resolveBaseLc(config.base)
  for (let i = 0; i < n; i++) {
    const h = hueForPaletteIndex(i, config)
    const ok = oklchColorAt(lightness, chroma, h)
    colors.push({
      index: i,
      hue: h,
      lightness: ok.l,
      chroma: ok.c,
      oklch: { l: ok.l, c: ok.c, h: ok.h },
    })
  }
  return colors
}
