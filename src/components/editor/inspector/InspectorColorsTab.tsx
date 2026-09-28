import { useEditorStore } from '../../../store/editorStore'
import { resolveSurfaceForTheme } from '../../../chart-spec/surfaceColors'
import type { ChartSurfaceColors } from '../../../chart-spec/types'
import { VisualizationPaletteControl } from './VisualizationPaletteControl'
import { ColorTokenRow } from './ColorTokenRow'
import { ColorsInspectorSection } from './ColorsInspectorSection'

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

export function InspectorColorsTab() {
  const spec = useEditorStore((s) => s.spec)
  const setSharedSpec = useEditorStore((s) => s.setSharedSpec)
  const theme = useEditorStore((s) => s.ui.theme)

  const surface = resolveSurfaceForTheme(spec.colors, theme)

  return (
    <div className="pb-2">
      <VisualizationPaletteControl
        spec={spec}
        theme={theme}
        config={spec.colors.visualization}
        onChange={(patch) =>
          setSharedSpec((s) => {
            s.colors.visualization = patch(s.colors.visualization)
          })
        }
      />

      <ColorsInspectorSection title="Static colors">
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
