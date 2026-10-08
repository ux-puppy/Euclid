import { normalizeHue } from './oklch'

/**
 * Hue ↔ iro wheel handle angle (defaults: wheelAngle 0, anticlockwise).
 * Matches `wheelHandleLocalPosition` in inspector/iroWheelLayout.ts.
 */
export function wheelHandleAngleDegFromHue(hue: number): number {
  return normalizeHue(360 - hue)
}

export function hueFromWheelHandleAngleDeg(handleAngle: number): number {
  return normalizeHue(360 - handleAngle)
}

/** Same scale as inspector Separation slider (0.25–1). */
export function hueSeparationCompressFactor(hueSeparation: number): number {
  const sep = Math.min(1, Math.max(0.25, hueSeparation))
  if (sep >= 1) return 1
  return 0.55 + 0.45 * ((sep - 0.25) / 0.75)
}

/**
 * Even palette on the iro wheel: 1…n in handle order. Separation compresses along that arc;
 * the wrap gap between the last color and 1 grows as separation drops.
 */
export function evenWheelTemplateHues(
  count: number,
  startHue: number,
  hueSeparation: number,
): number[] {
  const n = Math.max(1, count)
  if (n === 1) return [0]

  const compress = hueSeparationCompressFactor(hueSeparation)
  const step = 360 / n
  const anchor = wheelHandleAngleDegFromHue(startHue)

  return Array.from({ length: n }, (_, i) => {
    const handleAngle = normalizeHue(anchor + i * step * compress)
    const absoluteHue = hueFromWheelHandleAngleDeg(handleAngle)
    return normalizeHue(absoluteHue - startHue)
  })
}

/** Full separation (compress = 1). */
export function evenlySpacedTemplateHuesOnWheel(count: number, startHue: number): number[] {
  return evenWheelTemplateHues(count, startHue, 1)
}
