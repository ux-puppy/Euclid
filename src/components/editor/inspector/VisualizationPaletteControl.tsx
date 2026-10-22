import { useCallback, useEffect, useRef } from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import { MAX_PALETTE_BASE_COUNT } from '../../../visualization-colors/constants'
import { stripNudgedFillsFromConfig } from '../../../visualization-colors/accessibilityNudge'
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
import { colorsInspectorTooltips as T } from './colorsInspectorTooltips'
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
  { value: 'lightness', label: 'Change lightness', tooltip: T.palette.variantLightness },
  { value: 'chroma', label: 'Change chroma', tooltip: T.palette.variantChroma },
  { value: 'hue', label: 'Change hue', tooltip: T.palette.variantHue },
] as const

const EXCESS_VARIANT_OPTIONS = [
  { value: 'lightness', label: 'Change lightness', tooltip: T.palette.excessModeLightness },
  { value: 'chroma', label: 'Change chroma', tooltip: T.palette.excessModeChroma },
  { value: 'hue', label: 'Change hue', tooltip: T.palette.excessModeHue },
] as const

const EXCESS_MODE_OPTIONS = [
  { value: 'repeatWithShift', label: 'Repeat with shift', tooltip: T.palette.excessModeRepeat },
  ...EXCESS_VARIANT_OPTIONS,
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

  const patchPalette = useCallback(
    (patch: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => {
      onChange((prev) => stripNudgedFillsFromConfig(patch(prev)))
    },
    [onChange],
  )

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
      <ColorsInspectorSection title="OKLCH color space" titleTooltip={T.section.oklch}>
        <OklchPaletteWheel
          spec={spec}
          theme={theme}
          config={config}
          onChange={patchPalette}
          wheelWrapRef={wheelWrapRef}
          interactive={paletteWheelInView}
          tooltip={T.palette.wheel}
        />

        <AccessibilityContrastPanel
          spec={spec}
          theme={theme}
          config={config}
          onChange={onChange}
        />

        <SliderControl
          label="Base Count"
          tooltip={T.palette.baseCount}
          value={categoryCount}
          min={2}
          max={MAX_PALETTE_BASE_COUNT}
          step={1}
          readOnly={isCustom}
          onChange={(v) => regenerateAllData({ categoryCount: v, seriesCount: v })}
        />
        <SliderControl
          label="Key rotation"
          tooltip={T.palette.keyRotation}
          value={config.startHue}
          min={0}
          max={360}
          step={1}
          formatValue={(v) => `${Math.round(v)}°`}
          onChange={(startHue) => patchPalette((prev) => ({ ...prev, startHue }))}
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Perception Correction" titleTooltip={T.section.perception}>
        <SliderControl
          label="Lightness"
          tooltip={T.palette.lightnessCorrection}
          value={config.base.lightnessCorrection}
          min={0}
          max={1}
          step={0.01}
          formatValue={formatPercent}
          onChange={(lightnessCorrection) =>
            patchPalette((prev) => ({
              ...prev,
              base: { ...prev.base, lightnessCorrection },
            }))
          }
        />
        <SliderControl
          label="Chroma"
          tooltip={T.palette.chromaCorrection}
          value={config.base.chromaCorrection}
          min={0}
          max={1}
          step={0.01}
          formatValue={formatPercent}
          onChange={(chromaCorrection) =>
            patchPalette((prev) => ({
              ...prev,
              base: { ...prev.base, chromaCorrection },
            }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Hue separation" titleTooltip={T.section.hueSeparation}>
        <SwitchRow
          label="Smart color ordering"
          tooltip={T.palette.smartOrdering}
          checked={
            config.hueLayout === 'greedy' && (config.paletteRevision ?? 1) >= 2
          }
          onCheckedChange={(smart) =>
            patchPalette((prev) => ({
              ...prev,
              hueLayout: smart ? 'greedy' : 'even',
              paletteRevision: 2,
            }))
          }
        />
        <SliderControl
          label="Separation"
          tooltip={T.palette.hueSeparation}
          value={Math.min(1, Math.max(0.25, config.distanceWeights.hue))}
          min={0.25}
          max={1}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}×`}
          onChange={(hue) =>
            patchPalette((prev) => ({
              ...prev,
              distanceWeights: { ...prev.distanceWeights, hue },
            }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection
        title="Light Theme"
        titleTooltip={T.section.lightTheme}
        disabled={theme === 'dark'}
      >
        <SliderControl
          label="Light brightness"
          tooltip={T.palette.lightBrightness}
          value={config.lightMode.lightness}
          min={0.2}
          max={0.9}
          step={0.01}
          readOnly={theme === 'dark'}
          onChange={(lightness) =>
            patchPalette((prev) => ({ ...prev, lightMode: { ...prev.lightMode, lightness } }))
          }
        />
        <SliderControl
          label="Light chroma"
          tooltip={T.palette.lightChroma}
          value={config.lightMode.chroma}
          min={0.02}
          max={0.28}
          step={0.01}
          readOnly={theme === 'dark'}
          onChange={(chroma) =>
            patchPalette((prev) => ({ ...prev, lightMode: { ...prev.lightMode, chroma } }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection
        title="Dark Theme"
        titleTooltip={T.section.darkTheme}
        disabled={theme === 'light'}
      >
        <SliderControl
          label="Dark brightness"
          tooltip={T.palette.darkBrightness}
          value={config.darkMode.lightness}
          min={0.2}
          max={0.9}
          step={0.01}
          readOnly={theme === 'light'}
          onChange={(darkness) =>
            patchPalette((prev) => ({ ...prev, darkMode: { ...prev.darkMode, lightness: darkness } }))
          }
        />
        <SliderControl
          label="Dark chroma"
          tooltip={T.palette.darkChroma}
          value={config.darkMode.chroma}
          min={0.02}
          max={0.28}
          step={0.01}
          readOnly={theme === 'light'}
          onChange={(chroma) =>
            patchPalette((prev) => ({ ...prev, darkMode: { ...prev.darkMode, chroma } }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Excess Color (Experimental)" titleTooltip={T.section.excessColor}>
        <SwitchRow
          label="Handle excess colors"
          tooltip={T.palette.excessEnabled}
          checked={excess.enabled}
          onCheckedChange={(enabled) => patchPalette((prev) => patchExcess(prev, { enabled }))}
        />
        <InspectorReveal show={excess.enabled}>
          <SliderControl
            label="Activate after"
            tooltip={T.palette.excessActivateAfter}
            value={excess.activateAfter}
            min={2}
            max={MAX_PALETTE_BASE_COUNT}
            step={1}
            formatValue={(v) => `${Math.round(v)} colors`}
            onChange={(activateAfter) =>
              patchPalette((prev) => patchExcess(prev, { activateAfter }))
            }
          />
          <InspectorSelect
            value={excess.mode}
            tooltip={T.palette.excessEnabled}
            options={[...EXCESS_MODE_OPTIONS]}
            onChange={(mode) =>
              patchPalette((prev) => patchExcess(prev, { mode: mode as ExcessColorMode }))
            }
          />
          <InspectorReveal show={excess.mode === 'repeatWithShift'}>
            <SliderControl
              label="Shift amount"
              tooltip={T.palette.excessShift}
              value={excess.shiftDegrees}
              min={1}
              max={180}
              step={1}
              formatValue={(v) => `${Math.round(v)}°`}
              onChange={(shiftDegrees) =>
                patchPalette((prev) => patchExcess(prev, { shiftDegrees }))
              }
            />
          </InspectorReveal>
          <InspectorReveal show={excess.mode !== 'repeatWithShift'}>
            <SliderControl
              label="Change value"
              tooltip={T.palette.excessStep}
              value={excess.step}
              min={0.02}
              max={0.2}
              step={0.01}
              onChange={(step) => patchPalette((prev) => patchExcess(prev, { step }))}
            />
          </InspectorReveal>
          <SliderControl
            label="Opacity change"
            tooltip={T.palette.excessOpacity}
            value={excess.opacityStep}
            min={0}
            max={0.35}
            step={0.01}
            onChange={(opacityStep) =>
              patchPalette((prev) => patchExcess(prev, { opacityStep }))
            }
          />
        </InspectorReveal>
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Step Variants" titleTooltip={T.section.stepVariants} defaultOpen={false}>
        <InspectorSelect
          value={variantPropertySelectValue(config.variation.property)}
          tooltip={T.palette.variantProperty}
          options={[...VARIANT_PROPERTY_OPTIONS]}
          onChange={(property) =>
            patchPalette((prev) => ({
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
          tooltip={T.palette.variantStep}
          value={config.variation.step}
          min={0.02}
          max={0.2}
          step={0.01}
          onChange={(step) =>
            patchPalette((prev) => ({
              ...prev,
              variation: { ...prev.variation, step },
            }))
          }
        />
        <SliderControl
          label="Opacity change"
          tooltip={T.palette.variantOpacity}
          value={config.variation.opacityStep}
          min={0}
          max={0.35}
          step={0.01}
          onChange={(opacityStep) =>
            patchPalette((prev) => ({
              ...prev,
              variation: { ...prev.variation, opacityStep },
            }))
          }
        />
      </ColorsInspectorSection>
    </>
  )
}
