import iro from '@jaames/iro'
import { ArrowUpRight } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import type { VisualizationPaletteConfig } from '../../../visualization-colors/types'
import { resolvePalettePreview, requiredColorCount } from '../../../visualization-colors/resolve'
import { oklchToHex } from '../../../visualization-colors/oklch'
import type { ChartTheme } from '../../../visualization-colors/types'
import { useEditorStore } from '../../../store/editorStore'
import { ColorsInspectorSection } from './ColorsInspectorSection'
import { InspectorSelect } from './InspectorSelect'
import { SliderControl } from '../../ui/slider-control'

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

function variantPropertySelectValue(
  property: VisualizationPaletteConfig['variation']['property'],
): 'lightness' | 'chroma' | 'hue' {
  if (property === 'chroma' || property === 'hue') return property
  return 'lightness'
}

export function VisualizationPaletteControl({
  spec,
  theme,
  config,
  onChange,
}: VisualizationPaletteControlProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<ReturnType<typeof iro.ColorPicker> | null>(null)
  const configRef = useRef(config)
  const onChangeRef = useRef(onChange)
  configRef.current = config
  onChangeRef.current = onChange

  const regenerateAllData = useEditorStore((s) => s.regenerateAllData)
  const isCustom = spec.data.provenance === null
  const categoryCount = spec.data.provenance?.params?.categoryCount ?? 6

  const count = requiredColorCount(spec)
  const preview = resolvePalettePreview(config, theme, count)
  const startHex = oklchToHex(
    theme === 'light' ? config.lightMode.lightness : config.darkMode.lightness,
    theme === 'light' ? config.lightMode.chroma : config.darkMode.chroma,
    config.startHue,
  )

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const wheelColors = [startHex, ...preview.slice(0, Math.min(count, 11))]
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
        picker.setColors([startHex, ...preview.slice(0, Math.min(count, 11))], 0)
        return
      }
      const h = color.hsv.h ?? configRef.current.startHue
      onChangeRef.current((prev) => ({ ...prev, startHue: h }))
    }

    picker.on('color:change', onInput)
    picker.on('input:end', onInput)

    return () => {
      picker.off('color:change', onInput)
      picker.off('input:end', onInput)
      pickerRef.current = null
      mount.innerHTML = ''
    }
  }, [startHex, preview.join(','), count])

  const aboutLink = (
    <a
      href="https://oklch.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-100 hover:text-foreground"
    >
      About
      <ArrowUpRight size={14} weight="bold" aria-hidden />
    </a>
  )

  return (
    <>
      <ColorsInspectorSection title="OKLCH color space" headerRight={aboutLink} className="gap-3">
        <div className="mx-auto aspect-square w-full max-w-[200px]">
          <div ref={mountRef} className="iro-host [&_.IroColorPicker]:!bg-transparent" />
        </div>

        <div className="flex w-full justify-center gap-0.5 rounded-[30px] bg-control p-1">
          {preview.slice(0, 8).map((hex, i) => (
            <div
              key={i}
              className="size-5 shrink-0 rounded-full border border-border/40"
              style={{ background: hex }}
              title={`Color ${i + 1}`}
            />
          ))}
        </div>

        <SliderControl
          label="Base Count"
          value={categoryCount}
          min={2}
          max={16}
          step={1}
          readOnly={isCustom}
          onChange={(v) => regenerateAllData({ categoryCount: v })}
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

      <ColorsInspectorSection title="Correction">
        <SliderControl
          label="Lightness correction"
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
          label="Chroma correction"
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

      <ColorsInspectorSection title="Light Theme">
        <SliderControl
          label="Light brightness"
          value={config.lightMode.lightness}
          min={0.2}
          max={0.9}
          step={0.01}
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
          onChange={(chroma) =>
            onChange((prev) => ({ ...prev, lightMode: { ...prev.lightMode, chroma } }))
          }
        />
      </ColorsInspectorSection>

      <ColorsInspectorSection title="Dark Theme">
        <SliderControl
          label="Dark brightness"
          value={config.darkMode.lightness}
          min={0.2}
          max={0.9}
          step={0.01}
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
          onChange={(chroma) =>
            onChange((prev) => ({ ...prev, darkMode: { ...prev.darkMode, chroma } }))
          }
        />
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
