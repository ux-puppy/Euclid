import { useEffect, useRef } from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import { MAX_PALETTE_BASE_COUNT } from '../../../visualization-colors/constants'
import { resolveExcessColorHandling } from '../../../visualization-colors/defaults'
import type {
  ExcessColorMode,
  VisualizationPaletteConfig,
} from '../../../visualization-colors/types'
import type { ChartTheme } from '../../../visualization-colors/types'
import { useEditorStore } from '../../../store/editorStore'
import { OklchPaletteWheel } from './OklchPaletteWheel'
import { ColorsInspectorSection } from './ColorsInspectorSection'
import { InspectorSelect } from './InspectorSelect'
import { SwitchRow } from './SwitchRow'
import { SliderControl } from '../../ui/slider-control'
import { AccessibilityContrastPanel } from './AccessibilityContrastPanel'
import { InspectorReveal } from './InspectorReveal'
type VisualizationPaletteControlProps = {
  spec: ChartSpec
  theme: ChartTheme
  config: VisualizationPaletteConfig
  onChange: (patch: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => void
}

const formatPercent = (v: number) =>
  `${Math.round(v * 100)
    .toString()
    .padStart(2, '0')}%`

const VARIANT_PROPERTY_OPTIONS = [
  { value: 'lightness', label: 'Change lightness' },
  { value: 'chroma', label: 'Change chroma' },
  { value: 'hue', label: 'Change hue' },
] as const

const EXCESS_MODE_OPTIONS = [
  { value: 'repeatWithShift', label: 'Repeat with shift' },
  ...VARIANT_PROPERTY_OPTIONS,
] as const

function variantPropertySelectValue(
  property: VisualizationPaletteConfig['variation']['property'],
): 'lightness' | 'chroma' | 'hue' {
  if (property === 'chroma' || property === 'hue') return property
  return 'lightness'
}

function patchExcess(
  prev: VisualizationPaletteConfig,
  patch: Partial<ReturnType<typeof resolveExcessColorHandling>>,
): VisualizationPaletteConfig {
  const nextExcess = { ...resolveExcessColorHandling(prev), ...patch }
  return {
    ...prev,
    excessColorHandling: nextExcess,
    maxBaseColors: nextExcess.enabled ? nextExcess.activateAfter : MAX_PALETTE_BASE_COUNT,
  }
}

export function VisualizationPaletteControl({
  spec,
  theme,
  config,
  onChange,
}: VisualizationPaletteControlProps) {
  const wheelWrapRef = useRef<HTMLDivElement>(null)
  const paletteWheelInView = useEditorStore((s) => s.ui.paletteWheelInView)
  const setPaletteWheelInView = useEditorStore((s) => s.setPaletteWheelInView)

  const regenerateAllData = useEditorStore((s) => s.regenerateAllData)
  const isCustom = spec.data.provenance === null
  const categoryCount = spec.data.provenance?.params?.categoryCount ?? 6
  const excess = resolveExcessColorHandling(config)

  useEffect(() => {
    const target = wheelWrapRef.current
    if (!target) return

    const root = target.closest('.euclid-scroll-viewport')
    let debounce = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        window.clearTimeout(debounce)
        debounce = window.setTimeout(
          () => setPaletteWheelInView(entry.isIntersecting),
          80,
        )
      },
      { root: root ?? null, threshold: 0.05 },
    )
    observer.observe(target)
    return () => {
      window.clearTimeout(debounce)
      observer.disconnect()
      setPaletteWheelInView(true)
    }
  }, [setPaletteWheelInView])

  return (
    <>
      <ColorsInspectorSection title="OKLCH color space">
        <OklchPaletteWheel
          spec={spec}
          theme={theme}
          config={config}
          onChange={onChange}
          wheelWrapRef={wheelWrapRef}
          interactive={paletteWheelInView}
        />

        <AccessibilityContrastPanel
          spec={spec}
          theme={theme}
          config={config}
          onChange={onChange}
        />

        <SliderControl
          label="Base Count"
          value={categoryCount}
          min={2}
          max={MAX_PALETTE_BASE_COUNT}
          step={1}
          readOnly={isCustom}
          onChange={(v) => regenerateAllData({ categoryCount: v, seriesCount: v })}
        />
        <SliderControl
          label="Key rotation"
          value={config.startHue}
          min={0}
          max={360}
          step={1}
          formatValue={(v) => `${Math.round(v)}°`}
          onChange={(startHue) => onChange((prev) => ({ ...prev, startHue }))}
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Perception Correction">
        <SliderControl
          label="Lightness"
          value={config.base.lightnessCorrection}
          min={0}
          max={1}
          step={0.01}
          formatValue={formatPercent}
          onChange={(lightnessCorrection) =>
            onChange((prev) => ({
              ...prev,
              base: { ...prev.base, lightnessCorrection },
            }))
          }
        />
        <SliderControl
          label="Chroma"
          value={config.base.chromaCorrection}
          min={0}
          max={1}
          step={0.01}
          formatValue={formatPercent}
          onChange={(chromaCorrection) =>
            onChange((prev) => ({
              ...prev,
              base: { ...prev.base, chromaCorrection },
            }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Hue separation">
        <SwitchRow
          label="Smart color ordering"
          checked={
            config.hueLayout === 'greedy' && (config.paletteRevision ?? 1) >= 2
          }
          onCheckedChange={(smart) =>
            onChange((prev) => ({
              ...prev,
              hueLayout: smart ? 'greedy' : 'even',
              paletteRevision: 2,
            }))
          }
        />
        <SliderControl
          label="Separation"
          value={Math.min(1, Math.max(0.25, config.distanceWeights.hue))}
          min={0.25}
          max={1}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}×`}
          onChange={(hue) =>
            onChange((prev) => ({
              ...prev,
              distanceWeights: { ...prev.distanceWeights, hue },
            }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Light Theme" disabled={theme === 'dark'}>
        <SliderControl
          label="Light brightness"
          value={config.lightMode.lightness}
          min={0.2}
          max={0.9}
          step={0.01}
          readOnly={theme === 'dark'}
          onChange={(lightness) =>
            onChange((prev) => ({ ...prev, lightMode: { ...prev.lightMode, lightness } }))
          }
        />
        <SliderControl
          label="Light chroma"
          value={config.lightMode.chroma}
          min={0.02}
          max={0.28}
          step={0.01}
          readOnly={theme === 'dark'}
          onChange={(chroma) =>
            onChange((prev) => ({ ...prev, lightMode: { ...prev.lightMode, chroma } }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Dark Theme" disabled={theme === 'light'}>
        <SliderControl
          label="Dark brightness"
          value={config.darkMode.lightness}
          min={0.2}
          max={0.9}
          step={0.01}
          readOnly={theme === 'light'}
          onChange={(darkness) =>
            onChange((prev) => ({ ...prev, darkMode: { ...prev.darkMode, lightness: darkness } }))
          }
        />
        <SliderControl
          label="Dark chroma"
          value={config.darkMode.chroma}
          min={0.02}
          max={0.28}
          step={0.01}
          readOnly={theme === 'light'}
          onChange={(chroma) =>
            onChange((prev) => ({ ...prev, darkMode: { ...prev.darkMode, chroma } }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Excess Color (Experimental)">
        <SwitchRow
          label="Handle excess colors"
          checked={excess.enabled}
          onCheckedChange={(enabled) => onChange((prev) => patchExcess(prev, { enabled }))}
        />
        <InspectorReveal show={excess.enabled}>
          <SliderControl
            label="Activate after"
            value={excess.activateAfter}
            min={2}
            max={MAX_PALETTE_BASE_COUNT}
            step={1}
            formatValue={(v) => `${Math.round(v)} colors`}
            onChange={(activateAfter) =>
              onChange((prev) => patchExcess(prev, { activateAfter }))
            }
          />
          <InspectorSelect
            value={excess.mode}
            options={[...EXCESS_MODE_OPTIONS]}
            onChange={(mode) =>
              onChange((prev) => patchExcess(prev, { mode: mode as ExcessColorMode }))
            }
          />
          <InspectorReveal show={excess.mode === 'repeatWithShift'}>
            <SliderControl
              label="Shift amount"
              value={excess.shiftDegrees}
              min={1}
              max={180}
              step={1}
              formatValue={(v) => `${Math.round(v)}°`}
              onChange={(shiftDegrees) =>
                onChange((prev) => patchExcess(prev, { shiftDegrees }))
              }
            />
          </InspectorReveal>
          <InspectorReveal show={excess.mode !== 'repeatWithShift'}>
            <SliderControl
              label="Change value"
              value={excess.step}
              min={0.02}
              max={0.2}
              step={0.01}
              onChange={(step) => onChange((prev) => patchExcess(prev, { step }))}
            />
          </InspectorReveal>
          <SliderControl
            label="Opacity change"
            value={excess.opacityStep}
            min={0}
            max={0.35}
            step={0.01}
            onChange={(opacityStep) =>
              onChange((prev) => patchExcess(prev, { opacityStep }))
            }
          />
        </InspectorReveal>
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Step Variants" defaultOpen={false}>
        <InspectorSelect
          value={variantPropertySelectValue(config.variation.property)}
          options={[...VARIANT_PROPERTY_OPTIONS]}
          onChange={(property) =>
            onChange((prev) => ({
              ...prev,
              variation: {
                ...prev.variation,
                property: property as VisualizationPaletteConfig['variation']['property'],
              },
            }))
          }
        />
        <SliderControl
          label="Change value"
          value={config.variation.step}
          min={0.02}
          max={0.2}
          step={0.01}
          onChange={(step) =>
            onChange((prev) => ({
              ...prev,
              variation: { ...prev.variation, step },
            }))
          }
        />
        <SliderControl
          label="Opacity change"
          value={config.variation.opacityStep}
          min={0}
          max={0.35}
          step={0.01}
          onChange={(opacityStep) =>
            onChange((prev) => ({
              ...prev,
              variation: { ...prev.variation, opacityStep },
            }))
          }
        />
      </ColorsInspectorSection>
    </>
  )
}
