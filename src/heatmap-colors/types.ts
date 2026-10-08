export type HeatmapColorMode = 'sequential' | 'diverging'

export type GradientStop = {
  /** 0–1 along the gradient (low → high for that leg). */
  position: number
  color: string
}

export type HeatmapGradient = {
  stops: GradientStop[]
}

/** Base curve before optional quantization (maps linear data t ∈ [0,1]). */
export type HeatmapScaleInterpolation = 'linear' | 'log' | 'power'

/** Blends colors between gradient stops. */
export type HeatmapColorBlend = 'oklch' | 'srgb'

export type HeatmapInterpolation = {
  scale: HeatmapScaleInterpolation
  /** When true, quantize mapped t into `scaleSteps` bands (after scale curve). */
  scaleQuantized: boolean
  /** log scale base (≥ 2). */
  scaleLogBase: number
  /** power curve exponent (γ); 1 = linear. */
  scaleGamma: number
  /** Step count when `scaleQuantized` (≥ 2). */
  scaleSteps: number
  colorBlend: HeatmapColorBlend
}

export type HeatmapColorConfig = {
  mode: HeatmapColorMode
  interpolation: HeatmapInterpolation
  sequential: HeatmapGradient
  divergingZero: string
  negative: HeatmapGradient
  positive: HeatmapGradient
  /** @deprecated Migrated into `sequential.stops`. */
  sequentialStops?: string[]
  negativeStops?: string[]
  positiveStops?: string[]
}

export type HeatmapValueDomain = {
  min: number
  max: number
  hasNegative: boolean
  hasPositive: boolean
}
