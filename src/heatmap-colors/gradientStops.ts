import type { GradientStop, HeatmapGradient } from './types'

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
): HeatmapGradient {
  return {
    stops: normalizeGradientStops([
      ...gradient.stops,
      { position: clamp01(position), color },
    ]),
  }
}

export function removeGradientStopAt(gradient: HeatmapGradient, index: number): HeatmapGradient {
  if (gradient.stops.length <= 2) return gradient
  const sorted = sortStops(gradient.stops)
  return { stops: normalizeGradientStops(sorted.filter((_, i) => i !== index)) }
}

export function updateStopPosition(
  gradient: HeatmapGradient,
  index: number,
  position: number,
): HeatmapGradient {
  const sorted = sortStops(gradient.stops)
  const stop = sorted[index]
  if (!stop) return gradient
  const isEnd = index === 0 || index === sorted.length - 1
  const nextPos = isEnd ? (index === 0 ? 0 : 1) : clamp01(position)
  sorted[index] = { ...stop, position: nextPos }
  return { stops: normalizeGradientStops(sorted) }
}

export function updateStopColor(
  gradient: HeatmapGradient,
  index: number,
  color: string,
): HeatmapGradient {
  const sorted = sortStops(gradient.stops)
  if (!sorted[index]) return gradient
  sorted[index] = { ...sorted[index]!, color }
  return { stops: sorted }
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
