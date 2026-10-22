/** Hover tooltips for Colors inspector controls (native `title` attributes). */

export const colorsInspectorTooltips = {
  encoding: {
    categorical:
      'Assign a distinct palette color to each series or category.',
    value:
      'Color bars or cells by numeric value using a continuous heatmap scale.',
  },

  section: {
    oklch:
      'Generate categorical colors in OKLCH and tune the wheel, accessibility, and base count.',
    perception:
      'Normalize generated hues toward target lightness and chroma (perception correction).',
    hueSeparation: 'Control how base hues are spaced on the color wheel.',
    lightTheme: 'Target lightness and chroma for palette colors when the UI is in light mode.',
    darkTheme: 'Target lightness and chroma for palette colors when the UI is in dark mode.',
    excessColor:
      'Optional rules for series indices beyond the activate-after count (experimental).',
    stepVariants: 'How hierarchy depth steps change color within a branch.',
    staticColors: 'Chart chrome colors (background, axes, labels) for the active UI theme.',
    heatmapScale: 'Gradient, scale mapping, and interpolation for value-based coloring.',
    themeAdaptation: 'Flip gradient lightness in dark UI so values stay readable.',
    heatmapLightTheme: 'Brightness and chroma offsets for heatmap stops in light UI.',
    heatmapDarkTheme: 'Brightness and chroma offsets for heatmap stops in dark UI.',
  },

  palette: {
    wheel:
      'Drag hues on the OKLCH wheel to set palette anchors. Numbers show series order.',
    baseCount:
      'How many distinct base hues to generate (regenerates sample data categories/series).',
    keyRotation: 'Rotate the entire palette around the hue circle (degrees).',
    lightnessCorrection:
      'Pull generated base colors toward the theme lightness target (0 = off, 1 = full).',
    chromaCorrection:
      'Pull generated base colors toward the theme chroma target (0 = off, 1 = full).',
    smartOrdering:
      'When on, pick hues that are far apart in OKLCH; when off, use even 360° spacing.',
    hueSeparation:
      'Weight hue distance when smart ordering runs (higher = more separation).',
    lightBrightness: 'OKLCH lightness target for base fills in light UI.',
    lightChroma: 'OKLCH chroma target for base fills in light UI.',
    darkBrightness: 'OKLCH lightness target for base fills in dark UI.',
    darkChroma: 'OKLCH chroma target for base fills in dark UI.',
    excessEnabled: 'Apply special handling when there are more series than base slots.',
    excessActivateAfter:
      'Series index at which excess handling begins (2–max base count).',
    excessModeRepeat: 'Reuse palette colors with a hue shift for extra indices.',
    excessModeLightness: 'Vary lightness for indices beyond the activate-after count.',
    excessModeChroma: 'Vary chroma for indices beyond the activate-after count.',
    excessModeHue: 'Vary hue for indices beyond the activate-after count.',
    excessShift: 'Hue offset (degrees) applied on each repeat cycle.',
    excessStep: 'OKLCH step size for lightness, chroma, or hue excess modes.',
    excessOpacity: 'Alpha change per excess level when excess handling runs.',
    variantProperty: 'Which OKLCH channel changes between hierarchy depth levels.',
    variantLightness: 'Step hierarchy levels by changing OKLCH lightness.',
    variantChroma: 'Step hierarchy levels by changing OKLCH chroma.',
    variantHue: 'Step hierarchy levels by changing hue.',
    variantStep: 'Step size for depth-level color variation.',
    variantOpacity: 'Alpha change per hierarchy depth level.',
  },

  accessibility: {
    rowColors: 'Preview of categorical palette colors (series order).',
    rowText:
      'Pass/fail for on-chart label text contrast against each fill (see threshold).',
    rowBackground:
      'Pass/fail for each fill against the chart background (see threshold).',
    adjustEnabled:
      'Run a one-time OKLCH nudge on base palette slots to better meet your thresholds.',
    adjustDisabled: 'Every active color already meets both accessibility thresholds.',
    thresholdSection: 'Minimum WCAG contrast ratios used for badges and the adjust action.',
    textOnViz:
      'Required contrast between on-viz text and the visible fill (1:X ratio).',
    colorsOnBg:
      'Required contrast between each fill and the chart background (1:X ratio).',
    colorDot: (sequence: number) =>
      `Palette color ${sequence} as used for series or category ${sequence}.`,
  },

  heatmap: {
    scaleType: 'Sequential ramps from low to high; diverging emphasizes a midpoint.',
    scaleTypeSequential: 'Single direction from low values to high values.',
    scaleTypeDiverging: 'Two legs meeting at a center stop (positive / negative).',
    valueScale: 'How data values map to positions along the gradient before sampling.',
    scaleLinear: 'Map values linearly from min to max.',
    scaleLog: 'Logarithmic mapping (good for wide value ranges).',
    scalePower: 'Power (gamma) curve between min and max.',
    quantized: 'Snap mapped values to discrete steps along the scale.',
    stepCount: 'Number of discrete bands when quantization is enabled.',
    logBase: 'Base for logarithmic value mapping.',
    gamma: 'Exponent for power scaling (γ < 1 boosts lows; γ > 1 boosts highs).',
    stopTransparency: 'Honor alpha on gradient stops when rendering cells.',
    colorBlend:
      'Interpolation space between gradient stops (OKLCH vs sRGB).',
    blendOklch: 'Interpolate in OKLCH (perceptually smoother).',
    blendSrgb: 'Interpolate in sRGB (classic CSS-like blends).',
    adaptInversion:
      'In dark UI, mirror stop lightness around the anchor so strong colors stay visible.',
    lightBrightness: 'Shift heatmap stop lightness for light UI.',
    lightChroma: 'Shift heatmap stop chroma for light UI.',
    darkBrightness: 'Shift heatmap stop lightness for dark UI.',
    darkChroma: 'Shift heatmap stop chroma for dark UI.',
  },

  staticSurface: {
    background: 'Main chart plot and panel background.',
    text: 'Primary UI text (titles, chrome).',
    textSecondary: 'Text drawn on bars and marks (used for contrast checks).',
    axis: 'Axis label and tick color.',
    grid: 'Grid line color.',
    tooltip: 'Tooltip panel background.',
    hover: 'Text color inside tooltips.',
    barHoverBorder: 'Outline when hovering a bar.',
    barSelectedBorder: 'Outline for the selected bar.',
  },
} as const
