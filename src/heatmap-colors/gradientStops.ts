import type { GradientStop, HeatmapGradient } from './types'

/** Fixed center position for diverging scales (negative ↔ zero ↔ positive). */
export const DIVERGING_CENTER = 0.5

export const DIVERGING_CENTER_EPS = 0.002

/** Minimum gap between the center stop and movable interior stops. */
const DIVERGING_LEG_GAP = 0.02

export function isDivergingCenterStop(stop: GradientStop): boolean {
  return Math.abs(stop.position - DIVERGING_CENTER) < DIVERGING_CENTER_EPS
}

export function divergingCenterStopIndex(stops: GradientStop[]): number {
  return sortStops(stops).findIndex(isDivergingCenterStop)
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

export function sortStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.position - b.position)
}

/** Ensures endpoints at 0 and 1; sorts stops. */
export function normalizeGradientStops(stops: GradientStop[]): GradientStop[] {
  if (stops.length === 0) {
    return [
      { position: 0, color: '#1e3a5f' },
      { position: 1, color: '#e76f51' },
    ]
  }
  const sorted = sortStops(
    stops.map((s) => ({ position: clamp01(s.position), color: s.color })),
  )
  const first = sorted[0]!
  const out: GradientStop[] = []
  if (first.position > 0) out.push({ position: 0, color: first.color })
  for (const s of sorted) {
    if (out.length && Math.abs(out[out.length - 1]!.position - s.position) < 1e-6) {
      out[out.length - 1] = s
    } else {
      out.push(s)
    }
  }
  if (out[out.length - 1]!.position < 1) {
    out.push({ position: 1, color: out[out.length - 1]!.color })
  } else {
    out[out.length - 1] = { ...out[out.length - 1]!, position: 1 }
  }
  if (out[0]!.position > 0) out[0] = { ...out[0]!, position: 0 }
  return out
}

/** Ensures endpoints at 0 and 1 and a locked stop at {@link DIVERGING_CENTER}. */
export function normalizeDivergingGradientStops(
  stops: GradientStop[],
  centerColor: string,
): GradientStop[] {
  const center = { position: DIVERGING_CENTER, color: centerColor }
  const withoutCenter = sortStops(stops).filter((s) => !isDivergingCenterStop(s))
  const base = normalizeGradientStops(withoutCenter)
  const merged = sortStops([...base, center])
  const out: GradientStop[] = []
  for (const s of merged) {
    const atCenter = isDivergingCenterStop(s)
    const pos = atCenter ? DIVERGING_CENTER : s.position
    const entry = atCenter ? center : s
    if (out.length && Math.abs(out[out.length - 1]!.position - pos) < 1e-6) {
      out[out.length - 1] = entry
    } else {
      out.push(entry)
    }
  }
  if (out[0]!.position > 0) out.unshift({ position: 0, color: out[0]!.color })
  else out[0] = { ...out[0]!, position: 0 }
  const last = out[out.length - 1]!
  if (last.position < 1) out.push({ position: 1, color: last.color })
  else out[out.length - 1] = { ...last, position: 1 }

  const ci = out.findIndex(isDivergingCenterStop)
  if (ci < 0) {
    const insertAt = out.findIndex((s) => s.position > DIVERGING_CENTER)
    out.splice(insertAt === -1 ? out.length : insertAt, 0, center)
  } else {
    out[ci] = center
  }
  return out
}

export function hasDivergingCenterStop(stops: GradientStop[]): boolean {
  return divergingCenterStopIndex(stops) >= 0
}

/** Merge legacy negative / positive legs into one 0…1 diverging gradient. */
export function mergeDivergingLegsIntoSequential(
  negative: HeatmapGradient,
  positive: HeatmapGradient,
  centerColor: string,
): HeatmapGradient {
  const neg = sortStops(normalizeGradientStops(negative.stops))
  const pos = sortStops(normalizeGradientStops(positive.stops))
  const left = neg.map((s) => ({
    position: s.position * DIVERGING_CENTER,
    color: s.color,
  }))
  const right = pos.map((s) => ({
    position: DIVERGING_CENTER + s.position * DIVERGING_CENTER,
    color: s.color,
  }))
  return {
    stops: normalizeDivergingGradientStops([...left, ...right], centerColor),
  }
}

/** Split unified diverging gradient into 0…1 legs (for export / legacy fields). */
export function splitDivergingSequential(
  sequential: HeatmapGradient,
  centerColor: string,
): { negative: HeatmapGradient; positive: HeatmapGradient } {
  const stops = normalizeDivergingGradientStops(sequential.stops, centerColor)
  const negStops = stops
    .filter((s) => s.position <= DIVERGING_CENTER + DIVERGING_CENTER_EPS)
    .map((s) => ({
      position: s.position / DIVERGING_CENTER,
      color: s.color,
    }))
  const posStops = stops
    .filter((s) => s.position >= DIVERGING_CENTER - DIVERGING_CENTER_EPS)
    .map((s) => ({
      position: (s.position - DIVERGING_CENTER) / DIVERGING_CENTER,
      color: s.color,
    }))
  return {
    negative: { stops: normalizeGradientStops(negStops) },
    positive: { stops: normalizeGradientStops(posStops) },
  }
}

function clampDivergingInteriorPosition(
  sorted: GradientStop[],
  index: number,
  position: number,
): number {
  const centerIdx = divergingCenterStopIndex(sorted)
  if (centerIdx < 0 || index === centerIdx) return position
  const t = clamp01(position)
  if (index < centerIdx) {
    return Math.min(t, DIVERGING_CENTER - DIVERGING_LEG_GAP)
  }
  if (index > centerIdx) {
    return Math.max(t, DIVERGING_CENTER + DIVERGING_LEG_GAP)
  }
  return t
}

export function colorsToGradient(colors: string[]): HeatmapGradient {
  if (colors.length === 0) {
    return { stops: normalizeGradientStops([]) }
  }
  if (colors.length === 1) {
    return {
      stops: normalizeGradientStops([
        { position: 0, color: colors[0]! },
        { position: 1, color: colors[0]! },
      ]),
    }
  }
  return {
    stops: normalizeGradientStops(
      colors.map((color, i) => ({
        position: i / (colors.length - 1),
        color,
      })),
    ),
  }
}

export function addGradientStop(
  gradient: HeatmapGradient,
  position: number,
  color: string,
  diverging = false,
): HeatmapGradient {
  const t = clamp01(position)
  if (diverging && Math.abs(t - DIVERGING_CENTER) < 0.04) {
    return gradient
  }
  const next = {
    stops: normalizeGradientStops([...gradient.stops, { position: t, color }]),
  }
  if (!diverging) return next
  const center = gradient.stops.find(isDivergingCenterStop)
  if (!center) return next
  return {
    stops: normalizeDivergingGradientStops(next.stops, center.color),
  }
}

export function removeGradientStopAt(
  gradient: HeatmapGradient,
  index: number,
  diverging = false,
): HeatmapGradient {
  if (gradient.stops.length <= 2) return gradient
  const sorted = sortStops(gradient.stops)
  if (diverging) {
    const centerIdx = divergingCenterStopIndex(sorted)
    if (index === centerIdx || index === 0 || index === sorted.length - 1) return gradient
  }
  const next = { stops: normalizeGradientStops(sorted.filter((_, i) => i !== index)) }
  if (!diverging) return next
  const center = sorted.find(isDivergingCenterStop)
  if (!center) return next
  return { stops: normalizeDivergingGradientStops(next.stops, center.color) }
}

export function updateStopPosition(
  gradient: HeatmapGradient,
  index: number,
  position: number,
  diverging = false,
): HeatmapGradient {
  const sorted = sortStops(gradient.stops)
  const stop = sorted[index]
  if (!stop) return gradient
  if (diverging && isDivergingCenterStop(stop)) return gradient
  const isEnd = index === 0 || index === sorted.length - 1
  let nextPos = isEnd ? (index === 0 ? 0 : 1) : clamp01(position)
  if (diverging && !isEnd) {
    nextPos = clampDivergingInteriorPosition(sorted, index, nextPos)
  }
  sorted[index] = { ...stop, position: nextPos }
  const next = { stops: normalizeGradientStops(sorted) }
  if (!diverging) return next
  const center = sorted.find(isDivergingCenterStop)
  if (!center) return next
  return { stops: normalizeDivergingGradientStops(next.stops, center.color) }
}

export function updateStopColor(
  gradient: HeatmapGradient,
  index: number,
  color: string,
  diverging = false,
): HeatmapGradient {
  const sorted = sortStops(gradient.stops)
  if (!sorted[index]) return gradient
  sorted[index] = { ...sorted[index]!, color }
  if (!diverging) return { stops: sorted }
  const centerIdx = divergingCenterStopIndex(sorted)
  const centerColor = centerIdx >= 0 ? sorted[centerIdx]!.color : color
  return { stops: normalizeDivergingGradientStops(sorted, centerColor) }
}

/** Flip stop colors along the gradient (low ↔ high). */
export function mirrorGradient(gradient: HeatmapGradient): HeatmapGradient {
  const sorted = sortStops(normalizeGradientStops(gradient.stops))
  return {
    stops: normalizeGradientStops(
      sorted.map((s) => ({ position: 1 - s.position, color: s.color })),
    ),
  }
}
