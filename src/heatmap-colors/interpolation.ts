import type { HeatmapInterpolation } from './types'
import { clamp01 } from './gradientStops'

function quantizeMappedT(y: number, steps: number): number {
  const n = Math.max(2, Math.round(steps))
  const x = clamp01(y)
  const bucket = Math.min(n - 1, Math.floor(x * n))
  return bucket / (n - 1)
}

function mapScaleCurve(x: number, config: HeatmapInterpolation): number {
  switch (config.scale) {
    case 'power': {
      const g = Math.max(0.05, config.scaleGamma)
      return Math.pow(x, g)
    }
    case 'log': {
      const base = Math.max(2, config.scaleLogBase)
      if (x <= 0) return 0
      if (x >= 1) return 1
      return Math.log(1 + (base - 1) * x) / Math.log(base)
    }
    case 'linear':
    default:
      return x
  }
}

/** Maps linear normalized data t ∈ [0,1] through scale curve, then optional quantization. */
export function mapScaleT(t: number, config: HeatmapInterpolation): number {
  const x = clamp01(t)
  let y = mapScaleCurve(x, config)
  if (config.scaleQuantized) {
    y = quantizeMappedT(y, config.scaleSteps)
  }
  return y
}

/** Samples scale curve for visualization (input linear t, output mapped t). */
export function scaleCurveSamples(
  config: HeatmapInterpolation,
  count = 64,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const x = count <= 1 ? 0.5 : i / (count - 1)
    pts.push({ x, y: mapScaleT(x, config) })
  }
  return pts
}
