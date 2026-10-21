import { z } from 'zod'

import { MAX_PALETTE_BASE_COUNT } from '../visualization-colors/constants'
import {
  DEFAULT_VISUALIZATION_PALETTE,
  normalizePaletteConfig,
} from '../visualization-colors/defaults'

import {

  legacySurfaceFromTokens,

  migrateVisualizationFromLegacy,

  type LegacyColorTokens,

} from '../visualization-colors/migrateFromLegacy'

import { buildProgrammaticHeatmapSpec } from './defaults'
import { darkChartSurface } from './colorPresets'
import { normalizeHeatmapColors } from '../heatmap-colors/defaults'
import { normalizeChartPadding } from './padding'
import { cloneSurfaceByTheme, normalizeChartColors } from './surfaceColors'
import type { ChartGeometry, HeatmapChartSpec, HeatmapLayout } from './types'

function normalizeHeatmapLayout(
  layout: HeatmapLayout,
  geometry?: ChartGeometry,
): HeatmapLayout {
  const fallbackSize = geometry?.barThickness ?? 40
  const fallbackGap = geometry?.barGap ?? 4
  return {
    ...layout,
    mode: 'heatmap',
    cellWidth: layout.cellWidth ?? fallbackSize,
    cellHeight: layout.cellHeight ?? fallbackSize,
    lockCellSize: layout.lockCellSize ?? true,
    gap: layout.gap ?? fallbackGap,
    columnLabelOffsetX: layout.columnLabelOffsetX ?? 0,
    columnLabelOffsetY: layout.columnLabelOffsetY ?? 0,
    rowLabelOffsetX: layout.rowLabelOffsetX ?? 0,
    rowLabelOffsetY: layout.rowLabelOffsetY ?? 0,
    rowLabelWidth: layout.rowLabelWidth ?? 108,
    columnLabelBandHeight: layout.columnLabelBandHeight ?? 72,
  }
}



const paddingSchema = z.object({

  top: z.number(),

  right: z.number(),

  bottom: z.number(),

  left: z.number(),

})



const tabularPatternIdSchema = z.enum([
  'random',
  'increasing',
  'decreasing',
  'bell-curve',
  'wave',
  'peaks-valleys',
  'uniform',
  'clustered',
  'outliers',
  'positive-negative',
  'sparse',
])

const provenanceSchema = z

  .object({

    pattern: z.string(),

    seriesPattern: tabularPatternIdSchema.optional(),

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

  maxBaseColors: z.number().int().min(2).max(MAX_PALETTE_BASE_COUNT).optional(),

  excessColorHandling: z
    .object({
      enabled: z.boolean(),
      activateAfter: z.number().int().min(2).max(MAX_PALETTE_BASE_COUNT),
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

  encoding: z.enum(['categorical', 'value']).optional(),

  heatmap: z.record(z.string(), z.unknown()).optional(),

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

      composition: z
        .object({
          categories: z.array(z.string()),
          series: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              values: z.array(z.number()),
            }),
          ),
        })
        .optional(),

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

    stackGap: z.number().min(0).max(32).default(2),

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

    insetY: z.number().min(-32).max(32).default(0),

    valueLabelGap: z.number().min(0).max(48).default(6),

    valueColumnWidth: z.number().min(24).max(120).default(52),

    labelOverflow: z.enum(['fade', 'clip', 'overflow', 'outside']).default('fade'),

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



function migrateHeatmapChartSpec(raw: unknown): HeatmapChartSpec {
  const base = buildProgrammaticHeatmapSpec()
  if (!raw || typeof raw !== 'object') return base
  const bag = raw as Record<string, unknown>
  const merged = {
    ...base,
    ...bag,
    data: bag.data ?? base.data,
    layout: {
      ...base.layout,
      ...(typeof bag.layout === 'object' && bag.layout ? (bag.layout as object) : {}),
    },
    colors: {
      ...base.colors,
      ...(typeof bag.colors === 'object' && bag.colors ? (bag.colors as object) : {}),
    },
    geometry: { ...base.geometry, ...(bag.geometry as object) },
    labels: { ...base.labels, ...(bag.labels as object) },
    axes: { ...base.axes, ...(bag.axes as object) },
    grid: { ...base.grid, ...(bag.grid as object) },
    legend: { ...base.legend, ...(bag.legend as object) },
    tooltip: { ...base.tooltip, ...(bag.tooltip as object) },
    interaction: { ...base.interaction, ...(bag.interaction as object) },
    animation: { ...base.animation, ...(bag.animation as object) },
    renderer: { ...base.renderer, ...(bag.renderer as object) },
    typography: { ...base.typography, ...(bag.typography as object) },
  } as HeatmapChartSpec
  merged.chartType = 'heatmap'
  merged.variant = 'heatmap'
  if (merged.data.shape !== 'tabular') {
    merged.data = base.data
  }
  if (merged.layout.mode !== 'heatmap') {
    merged.layout = base.layout
  } else {
    merged.layout = normalizeHeatmapLayout(merged.layout, merged.geometry)
  }
  merged.colors = {
    surfaceByTheme: cloneSurfaceByTheme(merged.colors.surfaceByTheme),
    heatmap: normalizeHeatmapColors(merged.colors.heatmap),
  }
  return normalizeChartPadding(merged) as HeatmapChartSpec
}

export function migrateChartSpec(raw: unknown): import('./types').ChartSpec {
  const chartType =
    raw && typeof raw === 'object' && 'chartType' in raw
      ? (raw as { chartType: string }).chartType
      : 'bar'
  if (chartType === 'heatmap') {
    return migrateHeatmapChartSpec(raw)
  }

  const barRaw =
    raw && typeof raw === 'object' && !('chartType' in raw)
      ? { chartType: 'bar' as const, ...(raw as object) }
      : raw

  const version =

    raw && typeof raw === 'object' && 'schemaVersion' in raw

      ? (raw as { schemaVersion: number }).schemaVersion

      : 1



  let spec: import('./types').ChartSpec

  if (version === 1) {

    spec = migrateV1ToV2(chartSpecV1Schema.parse(barRaw))

  } else {

    spec = chartSpecV2Schema.parse(barRaw) as import('./types').ChartSpec

  }



  if (spec.layout.mode === 'cartesian' && spec.layout.orientation === 'vertical') {

    spec.layout.orientation = 'horizontal'

  }



  if (spec.chartType !== 'bar') {
    return normalizeChartPadding(spec)
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

  spec.colors = normalizeChartColors({
    ...spec.colors,
    encoding: spec.colors.encoding,
    heatmap: spec.colors.heatmap,
  })

  return normalizeChartPadding(spec)

}


