import type { HeatmapColorConfig, HeatmapColorMode, HeatmapGradient } from '../../../heatmap-colors/types'
import { normalizeHeatmapColors } from '../../../heatmap-colors/defaults'
import {
  isDivergingCenterStop,
  mergeDivergingLegsIntoSequential,
  normalizeDivergingGradientStops,
  splitDivergingSequential,
} from '../../../heatmap-colors/gradientStops'
import type { ChartTheme } from '../../../visualization-colors/types'
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
  theme: ChartTheme
  onChange: (patch: (prev: HeatmapColorConfig) => HeatmapColorConfig) => void
  sectionTitle?: string
}

export function HeatmapColorsControl({
  config,
  theme,
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

  const applyDivergingGradient = (sequential: HeatmapGradient) => {
    onChange((prev) => {
      const n = normalizeHeatmapColors(prev)
      const centerStop = sequential.stops.find(isDivergingCenterStop)
      const divergingZero = centerStop?.color ?? n.divergingZero
      const seq = {
        stops: normalizeDivergingGradientStops(sequential.stops, divergingZero),
      }
      const legs = splitDivergingSequential(seq, divergingZero)
      return {
        ...n,
        sequential: seq,
        divergingZero,
        negative: legs.negative,
        positive: legs.positive,
      }
    })
  }

  const setMode = (mode: HeatmapColorMode) => {
    onChange((prev) => {
      const n = normalizeHeatmapColors(prev)
      if (mode === 'diverging' && n.mode !== 'diverging') {
        const sequential = mergeDivergingLegsIntoSequential(
          n.negative,
          n.positive,
          n.divergingZero,
        )
        const legs = splitDivergingSequential(sequential, n.divergingZero)
        return {
          ...n,
          mode,
          sequential,
          negative: legs.negative,
          positive: legs.positive,
        }
      }
      return { ...n, mode }
    })
  }

  return (
    <>
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
        gradient={normalized.sequential}
        themeConfig={normalized}
        theme={theme}
        colorBlend={interp.colorBlend}
        onColorBlendChange={(colorBlend) => patchInterp({ colorBlend })}
      />

      <SwitchRow
        label="Apply stop transparency"
        checked={normalized.useStopAlpha}
        onCheckedChange={(useStopAlpha) =>
          onChange((prev) => ({ ...normalizeHeatmapColors(prev), useStopAlpha }))
        }
      />

      <HeatmapGradientEditor
        gradient={normalized.sequential}
        colorBlend={interp.colorBlend}
        themeConfig={normalized}
        theme={theme}
        diverging={normalized.mode === 'diverging'}
        onChange={(sequential) =>
          normalized.mode === 'diverging'
            ? applyDivergingGradient(sequential)
            : onChange((prev) => ({ ...normalizeHeatmapColors(prev), sequential }))
        }
      />
    </ColorsInspectorSection>

    <ColorsInspectorSection title="Theme adaptation">
      <SwitchRow
        label="Adapt inversion"
        checked={normalized.adaptInversion}
        onCheckedChange={(adaptInversion) =>
          onChange((prev) => ({ ...normalizeHeatmapColors(prev), adaptInversion }))
        }
      />
      <p className="text-[10px] text-muted-foreground leading-snug">
        In dark UI, flip stop lightness around the light anchor so strong colors stay
        prominent on a dark background (then apply dark brightness/chroma).
      </p>
    </ColorsInspectorSection>

    <ColorsInspectorSection title="Light theme" disabled={theme === 'dark'}>
      <p className="text-[10px] text-muted-foreground leading-snug">
        Adjust brightness and chroma for the light UI (relative to default scale anchors).
      </p>
      <SliderControl
        label="Light brightness"
        value={normalized.lightMode.lightness}
        min={0.2}
        max={0.9}
        step={0.01}
        readOnly={theme === 'dark'}
        onChange={(lightness) =>
          onChange((prev) => ({
            ...normalizeHeatmapColors(prev),
            lightMode: { ...normalizeHeatmapColors(prev).lightMode, lightness },
          }))
        }
      />
      <SliderControl
        label="Light chroma"
        value={normalized.lightMode.chroma}
        min={0.02}
        max={0.28}
        step={0.01}
        readOnly={theme === 'dark'}
        onChange={(chroma) =>
          onChange((prev) => ({
            ...normalizeHeatmapColors(prev),
            lightMode: { ...normalizeHeatmapColors(prev).lightMode, chroma },
          }))
        }
      />
    </ColorsInspectorSection>

    <ColorsInspectorSection title="Dark theme" disabled={theme === 'light'}>
      <p className="text-[10px] text-muted-foreground leading-snug">
        Dark UI applies an OKLCH shift from light settings. Tune dark brightness and chroma here.
      </p>
      <SliderControl
        label="Dark brightness"
        value={normalized.darkMode.lightness}
        min={0.2}
        max={0.9}
        step={0.01}
        readOnly={theme === 'light'}
        onChange={(lightness) =>
          onChange((prev) => ({
            ...normalizeHeatmapColors(prev),
            darkMode: { ...normalizeHeatmapColors(prev).darkMode, lightness },
          }))
        }
      />
      <SliderControl
        label="Dark chroma"
        value={normalized.darkMode.chroma}
        min={0.02}
        max={0.28}
        step={0.01}
        readOnly={theme === 'light'}
        onChange={(chroma) =>
          onChange((prev) => ({
            ...normalizeHeatmapColors(prev),
            darkMode: { ...normalizeHeatmapColors(prev).darkMode, chroma },
          }))
        }
      />
    </ColorsInspectorSection>
  </>
  )
}
