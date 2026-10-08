/** OKLCH template L/C when perception correction = 100% (full normalization). */
export const BASE_LIGHTNESS_TARGET = 0.72
export const BASE_CHROMA_TARGET = 0.12

/** Template L/C when perception correction = 0% (hue picking only; output uses standard HSL). */
export const BASE_LIGHTNESS_UNCORRECTED = 0.5
export const BASE_CHROMA_UNCORRECTED = 0.02

export type BaseCorrection = {
  lightnessCorrection: number
  chromaCorrection: number
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function inverseLerp(a: number, b: number, value: number): number {
  if (Math.abs(b - a) < 1e-9) return 1
  return clamp01((value - a) / (b - a))
}

export function resolveBaseLc(base: BaseCorrection): { lightness: number; chroma: number } {
  const lt = clamp01(base.lightnessCorrection)
  const ct = clamp01(base.chromaCorrection)
  return {
    lightness: lerp(BASE_LIGHTNESS_UNCORRECTED, BASE_LIGHTNESS_TARGET, lt),
    chroma: lerp(BASE_CHROMA_UNCORRECTED, BASE_CHROMA_TARGET, ct),
  }
}

/** Legacy `base: { lightness, chroma }` → correction sliders. */
export function migrateBaseCorrection(base: Record<string, unknown>): BaseCorrection {
  if (
    typeof base.lightnessCorrection === 'number' &&
    typeof base.chromaCorrection === 'number'
  ) {
    return {
      lightnessCorrection: clamp01(base.lightnessCorrection),
      chromaCorrection: clamp01(base.chromaCorrection),
    }
  }
  const lightness =
    typeof base.lightness === 'number' ? base.lightness : BASE_LIGHTNESS_TARGET
  const chroma = typeof base.chroma === 'number' ? base.chroma : BASE_CHROMA_TARGET
  return {
    lightnessCorrection: inverseLerp(
      BASE_LIGHTNESS_UNCORRECTED,
      BASE_LIGHTNESS_TARGET,
      lightness,
    ),
    chromaCorrection: inverseLerp(BASE_CHROMA_UNCORRECTED, BASE_CHROMA_TARGET, chroma),
  }
}
