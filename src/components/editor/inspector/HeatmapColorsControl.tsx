import type { HeatmapColorConfig, HeatmapColorMode } from '../../../heatmap-colors/types'
import { normalizeHeatmapColors } from '../../../heatmap-colors/defaults'
import { ColorTokenRow } from './ColorTokenRow'
import { ColorsInspectorSection } from './ColorsInspectorSection'
import { HeatmapGradientEditor } from './HeatmapGradientEditor'
import { HeatmapColorBlendCompare } from './HeatmapColorBlendCompare'
import { HeatmapScaleCurveGraph } from './HeatmapScaleCurveGraph'
import { InspectorSelect } from './InspectorSelect'
import { InspectorReveal } from './InspectorReveal'
import { SliderControl } from '../../ui/slider-control'
import { SwitchRow } from './SwitchRow'

type HeatmapColorsControlProps = {
  config: HeatmapColorConfig
  onChange: (patch: (prev: HeatmapColorConfig) => HeatmapColorConfig) => void
  sectionTitle?: string
}

export function HeatmapColorsControl({
  config,
  onChange,
  sectionTitle = 'Heatmap scale',
}: HeatmapColorsControlProps) {
  const normalized = normalizeHeatmapColors(config)
  const interp = normalized.interpolation

  const patchInterp = (partial: Partial<HeatmapColorConfig['interpolation']>) => {
    onChange((prev) => {
      const n = normalizeHeatmapColors(prev)
      return {
        ...n,
        interpolation: { ...n.interpolation, ...partial },
      }
    })
  }

  const setMode = (mode: HeatmapColorMode) => {
    onChange((prev) => ({ ...normalizeHeatmapColors(prev), mode }))
  }

  return (
    <ColorsInspectorSection title={sectionTitle}>
      <InspectorSelect
        label="Scale type"
        value={normalized.mode}
        options={[
          { value: 'sequential', label: 'Sequencial' },
          { value: 'diverging', label: 'Divergent' },
        ]}
        onChange={(v) => setMode(v as HeatmapColorMode)}
      />

      <InspectorSelect
        label="Value scale"
        value={interp.scale}
        options={[
          { value: 'linear', label: 'Linear' },
          { value: 'log', label: 'Logarithmic' },
          { value: 'power', label: 'Power (gamma)' },
        ]}
        onChange={(v) =>
          patchInterp({ scale: v as HeatmapColorConfig['interpolation']['scale'] })
        }
      />

      <SwitchRow
        label="Quantized"
        checked={interp.scaleQuantized}
        onCheckedChange={(checked) => patchInterp({ scaleQuantized: checked })}
      />

      <InspectorReveal show={interp.scaleQuantized}>
        <SliderControl
          label="Step count"
          value={interp.scaleSteps}
          min={2}
          max={24}
          step={1}
          onChange={(v) => patchInterp({ scaleSteps: v })}
        />
      </InspectorReveal>

      <InspectorReveal show={interp.scale === 'log'}>
        <SliderControl
          label="Log base"
          value={interp.scaleLogBase}
          min={2}
          max={100}
          step={1}
          onChange={(v) => patchInterp({ scaleLogBase: v })}
        />
      </InspectorReveal>

      <InspectorReveal show={interp.scale === 'power'}>
        <SliderControl
          label="Gamma (γ)"
          value={interp.scaleGamma}
          min={0.15}
          max={4}
          step={0.05}
          onChange={(v) => patchInterp({ scaleGamma: v })}
        />
      </InspectorReveal>

      <HeatmapScaleCurveGraph interpolation={interp} />

      <HeatmapColorBlendCompare
        gradient={
          normalized.mode === 'sequential' ? normalized.sequential : normalized.positive
        }
        colorBlend={interp.colorBlend}
        onColorBlendChange={(colorBlend) => patchInterp({ colorBlend })}
      />

      {normalized.mode === 'sequential' ? (
        <HeatmapGradientEditor
          gradient={normalized.sequential}
          colorBlend={interp.colorBlend}
          onChange={(sequential) =>
            onChange((prev) => ({ ...normalizeHeatmapColors(prev), sequential }))
          }
        />
      ) : (
        <>
          <ColorTokenRow
            variant="pill"
            label="Zero"
            value={normalized.divergingZero}
            onChange={(divergingZero) =>
              onChange((prev) => ({ ...normalizeHeatmapColors(prev), divergingZero }))
            }
          />
          <HeatmapGradientEditor
            gradient={normalized.negative}
            colorBlend={interp.colorBlend}
            onChange={(negative) =>
              onChange((prev) => ({ ...normalizeHeatmapColors(prev), negative }))
            }
          />
          <HeatmapGradientEditor
            gradient={normalized.positive}
            colorBlend={interp.colorBlend}
            onChange={(positive) =>
              onChange((prev) => ({ ...normalizeHeatmapColors(prev), positive }))
            }
          />
        </>
      )}
    </ColorsInspectorSection>
  )
}
