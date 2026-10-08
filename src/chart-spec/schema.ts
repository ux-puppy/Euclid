import { z } from 'zod'

import {
  DEFAULT_VISUALIZATION_PALETTE,
  normalizePaletteConfig,
} from '../visualization-colors/defaults'

import {

  legacySurfaceFromTokens,

  migrateVisualizationFromLegacy,

  type LegacyColorTokens,

} from '../visualization-colors/migrateFromLegacy'

import { darkChartSurface } from './colorPresets'

import { normalizeChartPadding } from './padding'

import { normalizeChartColors } from './surfaceColors'



const paddingSchema = z.object({

  top: z.number(),

  right: z.number(),

  bottom: z.number(),

  left: z.number(),

})



const provenanceSchema = z

  .object({

    pattern: z.string(),

    seed: z.number(),

    params: z.record(z.string(), z.number()),

  })

  .nullable()



const dataNodeSchema: z.ZodType<import('./types').DataNode> = z.lazy(() =>

  z.object({

    id: z.string(),

    label: z.string(),

    value: z.number(),

    color: z.string().optional(),

    children: z.array(dataNodeSchema).optional(),

  }),

)



const visualizationPaletteSchema = z.object({

  startHue: z.number(),

  base: z
    .object({
      lightnessCorrection: z.number().min(0).max(1),
      chromaCorrection: z.number().min(0).max(1),
    })
    .or(z.object({ lightness: z.number(), chroma: z.number() })),

  lightMode: z.object({ lightness: z.number(), chroma: z.number() }),

  darkMode: z.object({ lightness: z.number(), chroma: z.number() }),

  distanceWeights: z
    .object({
      lightness: z.number().min(0).max(4),
      chroma: z.number().min(0).max(4),
      hue: z.number().min(0).max(4),
    })
    .optional(),

  hueLayout: z.enum(['greedy', 'even']).optional(),

  paletteRevision: z.number().int().min(1).optional(),

  variation: z.object({

    property: z.enum(['lightness', 'chroma', 'hue', 'lightnessChroma']),

    step: z.number(),

    direction: z.enum(['lighter', 'darker', 'higherChroma', 'lowerChroma']),

    opacityStep: z.number().min(0).max(1).optional(),

    opacityDirection: z.enum(['decrease', 'increase']).optional(),

  }),

  maxBaseColors: z.number().int().min(2).max(32).optional(),

  excessColorHandling: z
    .object({
      enabled: z.boolean(),
      activateAfter: z.number().int().min(2).max(32),
      mode: z.enum(['repeatWithShift', 'lightness', 'chroma', 'hue']),
      shiftDegrees: z.number().min(0).max(360),
      step: z.number().min(0.02).max(0.5),
      opacityStep: z.number().min(0).max(0.35),
    })
    .optional(),

  hierarchyMode: z.enum(['globalDepth', 'perBranch']),

  assignments: z.record(z.string(), z.number()).optional(),

  accessibility: z
    .object({
      minRatioOnBackground: z.number().min(1).max(21),
      minRatioOnBarText: z.number().min(1).max(21),
    })
    .optional(),

})



const chartSurfaceSchema = z.object({

  background: z.string(),

  text: z.string(),

  textSecondary: z.string(),

  axis: z.string(),

  grid: z.string(),

  hover: z.string(),

  selected: z.string(),

  tooltip: z.string(),

  border: z.string(),

  barHoverBorder: z.string().optional(),

  barSelectedBorder: z.string().optional(),

})

const chartColorsV2Schema = z.object({

  surface: chartSurfaceSchema.optional(),

  surfaceByTheme: z
    .object({
      light: chartSurfaceSchema,
      dark: chartSurfaceSchema,
    })
    .optional(),

  visualization: visualizationPaletteSchema,

})



const specBodySchema = z.object({

  chartType: z.literal('bar'),

  variant: z.enum(['classic', 'breakdown', 'hierarchy']),

  chartPadding: z.number().min(0).max(128).default(24),

  containerCornerRadius: z.number().min(0).max(48).default(12),

  data: z.discriminatedUnion('shape', [

    z.object({

      shape: z.literal('tabular'),

      categories: z.array(z.string()),

      series: z.array(

        z.object({

          id: z.string(),

          name: z.string(),

          values: z.array(z.number()),

        }),

      ),

      provenance: provenanceSchema,

    }),

    z.object({

      shape: z.literal('tree'),

      root: dataNodeSchema,

      defaultExpandedDepth: z.number(),

      expandedNodeIds: z.array(z.string()).optional(),

      provenance: provenanceSchema,

    }),

  ]),

  layout: z.discriminatedUnion('mode', [

    z.object({

      mode: z.literal('cartesian'),

      width: z.number(),

      height: z.union([z.number(), z.literal('auto')]),

      padding: paddingSchema,

      orientation: z.enum(['vertical', 'horizontal']),

      barLayout: z.enum(['grouped', 'stacked']),

    }),

    z.object({

      mode: z.literal('list'),

      width: z.number(),

      height: z.union([z.number(), z.literal('auto')]),

      padding: paddingSchema,

      valueScale: z.enum(['global', 'group', 'parent']),

      rowGap: z.number(),

      groupGap: z.number(),

      indentPerLevel: z.number(),

      groupTitle: z.object({ show: z.boolean(), fontSize: z.number() }),

      showChevron: z.boolean(),

      showExpandAllControl: z.boolean(),

    }),

  ]),

  typography: z.object({

    fontFamily: z.string(),

    baseFontSize: z.number(),

  }),

  geometry: z.object({

    barThickness: z.number(),

    barGap: z.number(),

    groupGap: z.number(),

    cornerRadius: z.number().max(128),

    opacity: z.number(),

    borderWidth: z.number(),

  }),

  labels: z.object({

    show: z.boolean(),

    position: z.enum(['inside', 'outside', 'auto']),

    template: z.string(),

    insetX: z.number().min(0).max(64).default(8),

    valueLabelGap: z.number().min(0).max(48).default(6),

    valueColumnWidth: z.number().min(24).max(120).default(52),

    labelOverflow: z.enum(['clip', 'overflow', 'outside']),

    valueFontFamily: z.string().default('DM Mono'),

    valueFormat: z.object({

      style: z.enum(['percent', 'number']),

      decimals: z.number(),

      prefix: z.string(),

      suffix: z.string(),

    }),

  }),

  axes: z.object({

    x: z.object({

      show: z.boolean(),

      label: z.string(),

      tickCount: z.number(),

      fontSize: z.number(),

    }),

    y: z.object({

      show: z.boolean(),

      label: z.string(),

      tickCount: z.number(),

      fontSize: z.number(),

    }),

  }),

  grid: z.object({

    show: z.boolean(),

    color: z.string(),

    opacity: z.number(),

    strokeWidth: z.number(),

    dash: z.array(z.number()),

  }),

  legend: z.object({

    show: z.boolean(),

    position: z.enum(['top', 'bottom', 'right', 'left']),

    fontSize: z.number(),

  }),

  tooltip: z.object({

    show: z.boolean(),

    background: z.string(),

    fontSize: z.number(),

  }),

  interaction: z.object({

    hover: z.boolean(),

    select: z.boolean(),

    focus: z.boolean(),

  }),

  animation: z.object({

    enabled: z.boolean(),

    duration: z.number(),

    delay: z.number(),

    easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'custom']),

    customBezier: z.tuple([z.number(), z.number(), z.number(), z.number()]),

    stagger: z.number(),

    direction: z.enum(['left-right', 'right-left', 'top-bottom', 'bottom-top']),

    trigger: z.enum(['load', 'replay', 'expand']),

  }),

  renderer: z.object({

    devicePixelRatio: z.union([z.literal('auto'), z.number()]),

    antialias: z.boolean(),

  }),

})



const chartSpecV2Schema = specBodySchema.extend({

  schemaVersion: z.literal(2),

  colors: chartColorsV2Schema,

})



const chartSpecV1Schema = specBodySchema.extend({

  schemaVersion: z.literal(1),

  colors: z.object({

    background: z.string(),

    text: z.string(),

    textSecondary: z.string(),

    axis: z.string(),

    grid: z.string(),

    series: z.array(z.string()),

    depth: z.array(z.string()),

    hover: z.string(),

    selected: z.string(),

    tooltip: z.string(),

    border: z.string(),

  }),

})



export const chartSpecSchema = chartSpecV2Schema



function migrateV1ToV2(v1: z.infer<typeof chartSpecV1Schema>): import('./types').ChartSpec {

  const legacy = v1.colors as LegacyColorTokens

  return {

    ...v1,

    schemaVersion: 2,

    colors: normalizeChartColors({

      surface: legacySurfaceFromTokens(legacy),

      visualization: migrateVisualizationFromLegacy(legacy),

    }),

  } as import('./types').ChartSpec

}



export function migrateChartSpec(raw: unknown): import('./types').ChartSpec {

  const version =

    raw && typeof raw === 'object' && 'schemaVersion' in raw

      ? (raw as { schemaVersion: number }).schemaVersion

      : 1



  let spec: import('./types').ChartSpec

  if (version === 1) {

    spec = migrateV1ToV2(chartSpecV1Schema.parse(raw))

  } else {

    spec = chartSpecV2Schema.parse(raw) as import('./types').ChartSpec

  }



  if (spec.layout.mode === 'cartesian' && spec.layout.orientation === 'vertical') {

    spec.layout.orientation = 'horizontal'

  }



  if (!spec.colors.visualization) {

    spec.colors = normalizeChartColors({

      surface: { ...darkChartSurface },

      visualization: structuredClone(DEFAULT_VISUALIZATION_PALETTE),

    })

  } else {

    spec.colors = normalizeChartColors(spec.colors)

  }

  spec.colors.visualization = normalizePaletteConfig(spec.colors.visualization)

  return normalizeChartPadding(spec)

}


