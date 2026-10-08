import { useEditorStore } from '../../../store/editorStore'
import { resolveSurfaceForTheme } from '../../../chart-spec/surfaceColors'
import type { BarColorEncoding, ChartSurfaceColors } from '../../../chart-spec/types'
import { isBarChartSpec, isHeatmapChartSpec } from '../../../chart-spec/types'
import { VisualizationPaletteControl } from './VisualizationPaletteControl'
import { HeatmapColorsControl } from './HeatmapColorsControl'
import { ColorTokenRow } from './ColorTokenRow'
import { ColorsInspectorSection } from './ColorsInspectorSection'
import {
  inspectorField,
  inspectorSectionBodyPadding,
  inspectorStackGap,
  inspectorTabRoot,
} from './inspectorStyles'
import { cn } from '../../../lib/utils'
import { SegmentedControl } from '../../ui/segmented-control'

const STATIC_SURFACE_ROWS = [
  ['background', 'Background'],
  ['text', 'Text'],
  ['textSecondary', 'On viz text'],
  ['axis', 'Axis'],
  ['grid', 'Grid'],
  ['tooltip', 'Tooltip surface'],
  ['hover', 'Tooltip text'],
  ['barHoverBorder', 'Bar hover border'],
  ['barSelectedBorder', 'Bar selected border'],
] as const satisfies ReadonlyArray<[keyof ChartSurfaceColors, string]>

const BAR_ENCODING_OPTIONS = [
  { value: 'categorical' as const, label: 'Categorical' },
  { value: 'value' as const, label: 'Value based' },
]

export function InspectorColorsTab() {
  const spec = useEditorStore((s) => s.spec)
  const setSharedSpec = useEditorStore((s) => s.setSharedSpec)
  const setSpec = useEditorStore((s) => s.setSpec)
  const theme = useEditorStore((s) => s.ui.theme)

  const surface = resolveSurfaceForTheme(spec.colors, theme)

  return (
    <div className={inspectorTabRoot}>
      {isBarChartSpec(spec) && (
        <>
          <div
            className={cn(
              'flex w-full min-w-0 flex-col border-b border-border',
              inspectorSectionBodyPadding,
              'pt-3 pb-3.5',
              inspectorStackGap,
            )}
          >
            <SegmentedControl
              className={inspectorField}
              fullWidth
              compact
              options={BAR_ENCODING_OPTIONS}
              value={spec.colors.encoding ?? 'categorical'}
              onChange={(encoding: BarColorEncoding) =>
                setSharedSpec((s) => {
                  if (!isBarChartSpec(s)) return
                  s.colors.encoding = encoding
                })
              }
            />
          </div>
          {(spec.colors.encoding ?? 'categorical') === 'categorical' ? (
            <VisualizationPaletteControl
              spec={spec}
              theme={theme}
              config={spec.colors.visualization}
              onChange={(patch) =>
                setSharedSpec((s) => {
                  if (!isBarChartSpec(s)) return
                  s.colors.visualization = patch(s.colors.visualization)
                })
              }
            />
          ) : (
            <HeatmapColorsControl
              sectionTitle="Value scale"
              config={spec.colors.heatmap}
              onChange={(patch) =>
                setSharedSpec((s) => {
                  if (!isBarChartSpec(s)) return
                  s.colors.heatmap = patch(s.colors.heatmap)
                })
              }
            />
          )}
        </>
      )}
      {isHeatmapChartSpec(spec) && (
        <HeatmapColorsControl
          config={spec.colors.heatmap}
          onChange={(patch) =>
            setSpec((s) => {
              if (!isHeatmapChartSpec(s)) return
              s.colors.heatmap = patch(s.colors.heatmap)
            })
          }
        />
      )}

      <ColorsInspectorSection title="Static colors" defaultOpen={false}>
        {STATIC_SURFACE_ROWS.map(([key, label]) => (
          <ColorTokenRow
            key={`${key}-${label}`}
            variant="pill"
            label={label}
            value={surface[key]}
            onChange={(c) =>
              setSharedSpec((s) => {
                s.colors.surfaceByTheme[theme][key] = c
              })
            }
          />
        ))}
      </ColorsInspectorSection>
    </div>
  )
}
