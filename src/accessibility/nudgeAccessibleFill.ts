import type { AccessibilityContrastThresholds } from '../visualization-colors/types'
import { oklchFromHex, oklchToHex } from '../visualization-colors/oklch'
import {
  compositeOver,
  contrastRatio,
  contrastRatioFillOnBackground,
} from './contrast'
import { normalizeHue, oklchColorAt } from '../visualization-colors/oklch'

export type NudgeAccessibleFillContext = AccessibilityContrastThresholds & {
  background: string
  textSecondary: string
}

function opaqueHex(hex: string): string {
  const parsed = oklchFromHex(hex)
  if (!parsed) return hex
  return oklchToHex(parsed.l, parsed.c, parsed.h)
}

function visibleFillOnChart(hex: string, ctx: NudgeAccessibleFillContext): string {
  return compositeOver(hex, ctx.background)
}

function contrastMetrics(hex: string, ctx: NudgeAccessibleFillContext): {
  onBg: number | null
  onBarText: number | null
} {
  const visible = visibleFillOnChart(hex, ctx)
  return {
    onBg: contrastRatioFillOnBackground(hex, ctx.background),
    onBarText: contrastRatio(ctx.textSecondary, visible),
  }
}

function passesFill(hex: string, ctx: NudgeAccessibleFillContext): boolean {
  const { onBg, onBarText } = contrastMetrics(hex, ctx)
  if (onBg == null || onBarText == null) return false
  return onBg >= ctx.minRatioOnBackground && onBarText >= ctx.minRatioOnBarText
}

/** 1 when both thresholds met; otherwise fraction of the tighter constraint. */
function fillScore(hex: string, ctx: NudgeAccessibleFillContext): number {
  const { onBg, onBarText } = contrastMetrics(hex, ctx)
  if (onBg == null || onBarText == null) return -Infinity
  return Math.min(onBg / ctx.minRatioOnBackground, onBarText / ctx.minRatioOnBarText)
}

function bestLightnessForChroma(
  l0: number,
  c: number,
  h: number,
  ctx: NudgeAccessibleFillContext,
): string | null {
  const candidates: number[] = []
  const steps = 400
  for (let i = 0; i <= steps; i++) {
    candidates.push(i / steps)
  }

  let best: { l: number; dist: number } | null = null
  for (const l of candidates) {
    const at = oklchColorAt(l, c, h)
    const hex = oklchToHex(at.l, at.c, at.h)
    if (!passesFill(hex, ctx)) continue
    const dist = Math.abs(l - l0)
    if (!best || dist < best.dist || (dist === best.dist && Math.abs(l - 0.5) < Math.abs(best.l - 0.5))) {
      best = { l, dist }
    }
  }
  if (!best) return null
  return oklchToHex(best.l, c, h)
}

function bestEffortForChroma(
  l0: number,
  c: number,
  h: number,
  ctx: NudgeAccessibleFillContext,
  minScore: number,
): { hex: string; score: number } {
  let bestHex = oklchToHex(l0, c, h)
  let bestScore = fillScore(bestHex, ctx)
  for (let i = 0; i <= 400; i++) {
    const l = i / 400
    const at = oklchColorAt(l, c, h)
    const hex = oklchToHex(at.l, at.c, at.h)
    const score = fillScore(hex, ctx)
    const dist = Math.abs(l - l0)
    const bestDist = Math.abs((oklchFromHex(bestHex)?.l ?? l0) - l0)
    if (
      score > bestScore + 1e-9 ||
      (Math.abs(score - bestScore) <= 1e-9 && dist < bestDist)
    ) {
      bestScore = score
      bestHex = hex
    }
  }
  if (bestScore >= minScore) return { hex: bestHex, score: bestScore }
  return { hex: bestHex, score: bestScore }
}

/**
 * Minimally adjust fill in OKLCH (lightness first, then chroma) so both
 * contrast thresholds pass. Returns input unchanged when already passing.
 */
export function nudgeAccessibleFill(
  inputHex: string,
  ctx: NudgeAccessibleFillContext,
): string {
  const start = inputHex
  if (passesFill(start, ctx)) return start

  const ok = oklchFromHex(opaqueHex(start))
  if (!ok) return start

  let c = ok.c
  const h = ok.h
  const l0 = ok.l
  let fallback = { hex: opaqueHex(start), score: fillScore(opaqueHex(start), ctx) }

  for (let chromaStep = 0; chromaStep < 12; chromaStep++) {
    const hex = bestLightnessForChroma(l0, c, h, ctx)
    if (hex) return hex
    const effort = bestEffortForChroma(l0, c, h, ctx, 1)
    if (effort.score > fallback.score) fallback = effort
    if (effort.score >= 1) return effort.hex
    c *= 0.88
    if (c < 0.001) break
  }

  for (const delta of [15, 30, 45, 60, 90, 120, 180, 270]) {
    for (const sign of [-1, 1]) {
      const h2 = normalizeHue(h + sign * delta)
      const hex = bestLightnessForChroma(l0, ok.c, h2, ctx)
      if (hex) return hex
      const effort = bestEffortForChroma(l0, ok.c, h2, ctx, 1)
      if (effort.score > fallback.score) fallback = effort
      if (effort.score >= 1) return effort.hex
    }
  }

  for (let c2 = ok.c; c2 >= 0; c2 *= 0.75) {
    const effort = bestEffortForChroma(l0, c2, h, ctx, 1)
    if (effort.score > fallback.score) fallback = effort
    if (effort.score >= 1) return effort.hex
    if (c2 < 0.002) break
  }

  return fallback.score > fillScore(start, ctx) ? fallback.hex : start
}
