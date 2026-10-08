import iro from '@jaames/iro'
import { ArrowUpRight } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import { MAX_PALETTE_BASE_COUNT } from '../../../visualization-colors/constants'
import { resolveExcessColorHandling } from '../../../visualization-colors/defaults'
import type {
  ExcessColorMode,
  VisualizationPaletteConfig,
} from '../../../visualization-colors/types'
import { requiredColorCount, resolvePalettePreview, resolvePaletteSequence } from '../../../visualization-colors/resolve'
import { baseThemedHex } from '../../../visualization-colors/variantGenerator'
import type { ChartTheme } from '../../../visualization-colors/types'
import { useEditorStore } from '../../../store/editorStore'
import { ColorsInspectorSection } from './ColorsInspectorSection'
import { InspectorSelect } from './InspectorSelect'
import { SwitchRow } from './SwitchRow'
import { SliderControl } from '../../ui/slider-control'
import { AccessibilityContrastPanel } from './AccessibilityContrastPanel'
import { ColorSequenceDot } from './ColorSequenceDot'
import { IRO_WHEEL_LAYOUT, wheelHandleLocalPosition } from './iroWheelLayout'

type VisualizationPaletteControlProps = {
  spec: ChartSpec
  theme: ChartTheme
  config: VisualizationPaletteConfig
  onChange: (patch: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => void
}

const WHEEL_SIZE = 200

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
  const mountRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<ReturnType<typeof iro.ColorPicker> | null>(null)
  const [wheelLabels, setWheelLabels] = useState<
    { sequence: number; hex: string; x: number; y: number }[]
  >([])
  const configRef = useRef(config)
  const onChangeRef = useRef(onChange)
  configRef.current = config
  onChangeRef.current = onChange

  const regenerateAllData = useEditorStore((s) => s.regenerateAllData)
  const isCustom = spec.data.provenance === null
  const categoryCount = spec.data.provenance?.params?.categoryCount ?? 6

  const count = requiredColorCount(spec)
  const preview = resolvePalettePreview(config, theme, count)
  const startHex = baseThemedHex(config.startHue, config, theme)
  const excess = resolveExcessColorHandling(config)

  const wheelColors = [startHex, ...preview.slice(0, Math.min(count, MAX_PALETTE_BASE_COUNT))]
  const wheelColorsRef = useRef(wheelColors)
  wheelColorsRef.current = wheelColors

  const syncWheelLabels = useCallback(() => {
    const wrap = wheelWrapRef.current
    const mount = mountRef.current
    const picker = pickerRef.current
    if (!wrap || !mount || !picker) return
    const wrapRect = wrap.getBoundingClientRect()
    const sequence = resolvePaletteSequence(config, theme, count)
    const next: { sequence: number; hex: string; x: number; y: number }[] = []
    const wheelEl = mount.querySelector('.IroWheel') ?? mount
    const wheelRect = wheelEl.getBoundingClientRect()
    const wheelOffsetX = wheelRect.left - wrapRect.left
    const wheelOffsetY = wheelRect.top - wrapRect.top
    for (let i = 1; i < picker.colors.length; i++) {
      const color = picker.colors[i]
      const slot = sequence[i - 1]
      if (!slot) continue
      const hsv = color.hsv
      const local = wheelHandleLocalPosition(
        IRO_WHEEL_LAYOUT,
        hsv.h ?? 0,
        hsv.s ?? 100,
      )
      next.push({
        sequence: slot.sequence,
        hex: slot.hex,
        x: wheelOffsetX + local.x,
        y: wheelOffsetY + local.y,
      })
    }
    setWheelLabels(next)
  }, [config, theme, count])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const picker = iro.ColorPicker(mount, {
      width: WHEEL_SIZE,
      color: startHex,
      colors: wheelColors,
      layout: [{ component: iro.ui.Wheel, options: {} }],
    })
    pickerRef.current = picker
    picker.setActiveColor(0)

    const onInput = (color: iro.Color) => {
      const idx = picker.color.index
      if (idx !== 0) {
        picker.setColors(wheelColorsRef.current, 0)
        return
      }
      const h = color.hsv.h ?? configRef.current.startHue
      onChangeRef.current((prev) => ({ ...prev, startHue: h }))
    }

    const onLayout = () => requestAnimationFrame(syncWheelLabels)

    picker.on('color:change', onInput)
    picker.on('input:end', onInput)
    picker.on('color:change', onLayout)
    picker.on('input:end', onLayout)
    requestAnimationFrame(syncWheelLabels)

    return () => {
      picker.off('color:change', onInput)
      picker.off('input:end', onInput)
      picker.off('color:change', onLayout)
      picker.off('input:end', onLayout)
      pickerRef.current = null
      mount.innerHTML = ''
      setWheelLabels([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; colors sync in effect below
  }, [count, syncWheelLabels])

  useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return
    picker.setColors(wheelColors, picker.color.index === 0 ? 0 : picker.color.index)
    requestAnimationFrame(syncWheelLabels)
  }, [wheelColors.join('|'), startHex, syncWheelLabels])

  useEffect(() => {
    requestAnimationFrame(syncWheelLabels)
  }, [config.hueLayout, config.paletteRevision, config.startHue, syncWheelLabels])

  const aboutLink = (
    <a
      href="https://oklch.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.6px] text-muted-foreground transition-colors duration-100 hover:text-foreground"
    >
      About
      <ArrowUpRight size={14} weight="bold" aria-hidden />
    </a>
  )

  return (
    <>
      <ColorsInspectorSection
        title="OKLCH color space"
        headerRight={aboutLink}
        contentClassName="gap-3"
      >
        <div
          ref={wheelWrapRef}
          className="relative mx-auto aspect-square w-full max-w-[200px]"
        >
          <div
            ref={mountRef}
            className="iro-numbered-wheel iro-host [&_.IroColorPicker]:!bg-transparent [&_.IroHandle:not(.IroHandle--0)_circle]:opacity-0"
          />
          <div className="pointer-events-none absolute inset-0">
            {wheelLabels.map((label, index) => (
              <ColorSequenceDot
                key={`${index}-${label.sequence}`}
                sequence={label.sequence}
                hex={label.hex}
                variant="wheel"
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: label.x, top: label.y }}
              />
            ))}
          </div>
        </div>

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
        {excess.enabled && (
          <>
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
            {excess.mode === 'repeatWithShift' && (
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
            )}
            {excess.mode !== 'repeatWithShift' && (
              <SliderControl
                label="Change value"
                value={excess.step}
                min={0.02}
                max={0.2}
                step={0.01}
                onChange={(step) => onChange((prev) => patchExcess(prev, { step }))}
              />
            )}
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
          </>
        )}
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Step Variants">
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
