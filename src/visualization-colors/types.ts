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
  /** >0 when excess handling applied OKLCH / alpha variation. */
  excessLevel?: number
  /** Source slot in the first palette set (excess handling). */
  paletteSlot?: number
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

/** How base hues are picked on the wheel before key rotation. */
export type HueLayout = 'greedy' | 'even'

/** Behavior for palette indices beyond `activateAfter` (when handling is enabled). */
export type ExcessColorMode = 'repeatWithShift' | 'lightness' | 'chroma' | 'hue'

export type ExcessColorHandling = {
  enabled: boolean
  /** Feature applies to color index ≥ this count (2–16). */
  activateAfter: number
  mode: ExcessColorMode
  /** Hue offset per repeat cycle when mode is `repeatWithShift`. */
  shiftDegrees: number
  /** Same semantics as step variants (lightness / chroma / hue modes). */
  step: number
  opacityStep: number
}

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

/** User-defined minimum WCAG contrast ratios (not tied to AA/AAA presets). */
export type AccessibilityContrastThresholds = {
  minRatioOnBackground: number
  minRatioOnBarText: number
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
  /** Greedy farthest-point hues vs equal 360°/n spacing (see also separation slider). */
  hueLayout: HueLayout
  /** Bumped when hue layout semantics change; used to migrate legacy autosave. */
  paletteRevision?: number
  variation: {
    property: VariationProperty
    step: number
    direction: VariationDirection
    /** Alpha delta per hierarchy level (0 = unchanged). Combined with property above. */
    opacityStep: number
    opacityDirection: OpacityVariationDirection
  }
  /** @deprecated Synced from `excessColorHandling.activateAfter` when enabled; kept for autosave. */
  maxBaseColors: number
  excessColorHandling?: ExcessColorHandling
  hierarchyMode: HierarchyColorMode
  assignments?: Record<string, number>
  accessibility?: AccessibilityContrastThresholds
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
