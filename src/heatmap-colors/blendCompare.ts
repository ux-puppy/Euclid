import { converter, differenceEuclidean } from 'culori'
import { sampleGradientAt } from './resolve'
import type { HeatmapGradient } from './types'

const toOklab = converter('oklab')
const deltaOklab = differenceEuclidean('oklab')

function oklabDeltaE(a: string, b: string): number {
  const ca = toOklab(a)
  const cb = toOklab(b)
  if (!ca || !cb) return 0
  return deltaOklab(ca, cb)
}

export function gradientStripCss(samples: string[]): string {
  if (samples.length === 0) return 'linear-gradient(to right, #888888, #888888)'
  if (samples.length === 1) {
    const c = samples[0]!
    return `linear-gradient(to right, ${c} 0%, ${c} 100%)`
  }
  const last = samples.length - 1
  const parts = samples.map((c, i) => `${c} ${((i / last) * 100).toFixed(4)}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}

export type BlendDifferenceSample = { x: number; y: number; deltaE: number }

/** Perceptual ΔE (OKLab) between OKLCH vs sRGB blend at each t along the gradient. */
export function blendDifferenceSamples(
  gradient: HeatmapGradient,
  count = 64,
): BlendDifferenceSample[] {
  const pts: BlendDifferenceSample[] = []
  for (let i = 0; i < count; i++) {
    const x = count <= 1 ? 0.5 : i / (count - 1)
    const ok = sampleGradientAt(gradient, x, 'oklch')
    const rgb = sampleGradientAt(gradient, x, 'srgb')
    const deltaE = oklabDeltaE(ok, rgb)
    pts.push({ x, y: Number.isFinite(deltaE) ? deltaE : 0, deltaE })
  }
  const max = Math.max(...pts.map((p) => p.deltaE), 1e-9)
  return pts.map((p) => ({ ...p, y: p.deltaE / max }))
}

function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

/** Few sparse ΔE samples, resampled to a smooth curve for display. */
export function blendDifferenceSmoothCurve(
  gradient: HeatmapGradient,
  sparseCount = 32,
  smoothSteps = 64,
): BlendDifferenceSample[] {
  const sparse = blendDifferenceSamples(gradient, sparseCount)
  if (sparse.length <= 1) return sparse
  if (sparse.length === 2) {
    const out: BlendDifferenceSample[] = []
    for (let i = 0; i < smoothSteps; i++) {
      const t = i / (smoothSteps - 1)
      const y = sparse[0]!.y + (sparse[1]!.y - sparse[0]!.y) * t
      const deltaE = sparse[0]!.deltaE + (sparse[1]!.deltaE - sparse[0]!.deltaE) * t
      out.push({ x: t, y, deltaE })
    }
    return out
  }

  const ys = sparse.map((p) => p.y)
  const n = sparse.length
  const out: BlendDifferenceSample[] = []
  const segments = smoothSteps - 1

  for (let i = 0; i < smoothSteps; i++) {
    const u = i / segments
    const xf = u * (n - 1)
    const seg = Math.min(Math.floor(xf), n - 2)
    const t = xf - seg
    const y = catmullRom1D(
      ys[Math.max(0, seg - 1)]!,
      ys[seg]!,
      ys[seg + 1]!,
      ys[Math.min(n - 1, seg + 2)]!,
      t,
    )
    const deltaE = catmullRom1D(
      sparse[Math.max(0, seg - 1)]!.deltaE,
      sparse[seg]!.deltaE,
      sparse[seg + 1]!.deltaE,
      sparse[Math.min(n - 1, seg + 2)]!.deltaE,
      t,
    )
    out.push({
      x: u,
      y: Math.max(0, Math.min(1, y)),
      deltaE: Math.max(0, deltaE),
    })
  }
  return out
}
