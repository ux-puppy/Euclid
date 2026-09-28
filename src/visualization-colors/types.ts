export type OklchColor = {
  l: number
  c: number
  h: number
}

export type BaseVisualizationColor = {
  index: number
  hue: number
  lightness: number
  chroma: number
  oklch: OklchColor
}

export type VariationProperty = 'lightness' | 'chroma' | 'hue' | 'lightnessChroma'

export type VariationDirection =
  | 'lighter'
  | 'darker'
  | 'higherChroma'
  | 'lowerChroma'

/** Per-level alpha change applied together with the OKLCH variant property. */
export type OpacityVariationDirection = 'decrease' | 'increase'

export type HierarchyColorMode = 'globalDepth' | 'perBranch'

/** Relative influence of each OKLCH axis when picking maximally separated hues. */
export type OklchDistanceWeights = {
  lightness: number
  chroma: number
  hue: number
}

export type OklchLc = {
  lightness: number
  chroma: number
}

export type BaseCorrection = {
  /** 0 = no lightness normalization; 1 = full target lightness for generated hues. */
  lightnessCorrection: number
  /** 0 = minimal chroma; 1 = full target chroma for generated hues. */
  chromaCorrection: number
}

export type VisualizationPaletteConfig = {
  startHue: number
  base: BaseCorrection
  /** Rendered base colors in light UI theme (brightness + saturation). */
  lightMode: OklchLc
  /** Rendered base colors in dark UI theme (brightness + saturation). */
  darkMode: OklchLc
  /** Per-axis weighting for perceptual distance when selecting hues. */
  distanceWeights: OklchDistanceWeights
  variation: {
    property: VariationProperty
    step: number
    direction: VariationDirection
    /** Alpha delta per hierarchy level (0 = unchanged). Combined with property above. */
    opacityStep: number
    opacityDirection: OpacityVariationDirection
  }
  maxBaseColors: 12
  hierarchyMode: HierarchyColorMode
  assignments?: Record<string, number>
}

export type ChartTheme = 'light' | 'dark'

export type ResolveVisualizationContext = {
  theme: ChartTheme
  colorCount: number
  maxTreeDepth?: number
}

export type ResolvedVisualizationColors = {
  seriesByIndex: string[]
  depthByLevel: string[]
  baseColors: BaseVisualizationColor[]
  colorForSeriesIndex: (index: number) => string
  colorForTreeRow: (row: TreeRowColorInput) => string
}

export type TreeRowColorInput = {
  depth: number
  depthInBranch: number
  branchRootId: string | null
  explicitColor?: string
}
