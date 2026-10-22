import { useMemo, useState } from 'react'
import { MAX_PALETTE_BASE_COUNT } from '../../visualization-colors/constants'
import { DEFAULT_VISUALIZATION_PALETTE, normalizePaletteConfig } from '../../visualization-colors/defaults'
import type { ChartTheme, VisualizationPaletteConfig } from '../../visualization-colors/types'
import { requiredColorCount, resolvePalettePreview } from '../../visualization-colors/resolve'
import { SliderControl } from '../../components/ui/slider-control'
import { SwitchRow } from '../../components/editor/inspector/SwitchRow'
import { OklchPaletteWheel } from '../../components/editor/inspector/OklchPaletteWheel'
import { AccessibilityContrastPanel } from '../../components/editor/inspector/AccessibilityContrastPanel'
import { HeatmapGradientEditor } from '../../components/editor/inspector/HeatmapGradientEditor'
import { DEFAULT_HEATMAP_COLORS, normalizeHeatmapColors } from '../../heatmap-colors/defaults'
import { applyHeatmapTheme } from '../../heatmap-colors/themeAdapt'
import { colorForHeatmapValue, domainFromValues } from '../../heatmap-colors/resolve'
import type { HeatmapColorConfig } from '../../heatmap-colors/types'
import { sampleGradientStrip } from '../../heatmap-colors/resolve'
import { labelOnFill } from '../../accessibility/contrast'
import { createDemoBarSpec } from '../demoSpec'
import { DemoCard } from '../components/DemoCard'
import { DemoControls } from '../components/DemoControls'
import { PaletteStrip } from '../components/PaletteStrip'
import { cn } from '../../lib/utils'

const formatPercent = (v: number) =>
  `${Math.round(v * 100)
    .toString()
    .padStart(2, '0')}%`

const DEMO_THEME: ChartTheme = 'dark'

/** Smart ordering on by default for all case-study palette demos. */
const DEMO_PALETTE_DEFAULTS: Partial<VisualizationPaletteConfig> = {
  hueLayout: 'greedy',
  paletteRevision: 2,
}

function usePaletteDemoState(initial?: Partial<VisualizationPaletteConfig>) {
  const [config, setConfig] = useState(() =>
    normalizePaletteConfig({
      ...DEFAULT_VISUALIZATION_PALETTE,
      ...DEMO_PALETTE_DEFAULTS,
      ...initial,
    }),
  )
  const patch = (fn: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => {
    setConfig((prev) => normalizePaletteConfig(fn(prev)))
  }
  return [config, patch] as const
}

export function GeneratedColorsDemo() {
  const [seriesCount, setSeriesCount] = useState(10)
  const spec = useMemo(() => createDemoBarSpec(seriesCount), [seriesCount])
  const [config, patch] = usePaletteDemoState({
    darkMode: { lightness: 0.62, chroma: 0.1 },
  })
  const count = requiredColorCount(spec)
  const colors = useMemo(
    () => resolvePalettePreview(config, DEMO_THEME, count, spec),
    [config, count, spec],
  )

  return (
    <DemoCard className="flex flex-col gap-3 sm:flex-row sm:gap-2">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        <DemoControls>
        <SliderControl
          appearance="colors"
          label="Base Count"
          value={seriesCount}
          min={2}
          max={MAX_PALETTE_BASE_COUNT}
          step={1}
          onChange={setSeriesCount}
        />
        <SliderControl
          appearance="colors"
          label="Key rotation"
          value={config.startHue}
          min={0}
          max={360}
          step={1}
          formatValue={(v) => `${Math.round(v)}°`}
          onChange={(startHue) => patch((prev) => ({ ...prev, startHue }))}
        />
        </DemoControls>
        <PaletteStrip colors={colors} />
      </div>
      <div className="mx-auto w-[168px] shrink-0 sm:mx-0">
        <OklchPaletteWheel
          spec={spec}
          theme={DEMO_THEME}
          config={config}
          size={168}
          interactive
          onChange={patch}
          className="aspect-square w-full"
        />
      </div>
    </DemoCard>
  )
}

export function ChoosingOklchDemo() {
  const spec = useMemo(() => createDemoBarSpec(10), [])
  const [oklchEnabled, setOklchEnabled] = useState(false)
  const [config, patch] = usePaletteDemoState({
    darkMode: { lightness: 0.6, chroma: 0.11 },
    base: { lightnessCorrection: 1, chromaCorrection: 1 },
  })
  const effective = useMemo(() => {
    if (oklchEnabled) return config
    return normalizePaletteConfig({
      ...config,
      base: { lightnessCorrection: 0, chromaCorrection: 0 },
    })
  }, [config, oklchEnabled])
  const count = requiredColorCount(spec)
  const colors = useMemo(
    () => resolvePalettePreview(effective, DEMO_THEME, count, spec),
    [effective, count, spec],
  )

  return (
    <DemoCard className="flex flex-col gap-3 sm:flex-row sm:gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <DemoControls>
          <SwitchRow
            label="Perceptual OKLCH correction"
            checked={oklchEnabled}
            onCheckedChange={setOklchEnabled}
          />
        </DemoControls>
        <DemoControls>
          <SliderControl
          appearance="colors"
            label="Lightness Value"
            value={config.darkMode.lightness}
            min={0.2}
            max={0.9}
            step={0.01}
            formatValue={formatPercent}
            onChange={(lightness) =>
              patch((prev) => ({
                ...prev,
                darkMode: { ...prev.darkMode, lightness },
              }))
            }
          />
          <SliderControl
          appearance="colors"
            label="Chroma Value"
            value={config.darkMode.chroma}
            min={0.02}
            max={0.28}
            step={0.01}
            formatValue={formatPercent}
            onChange={(chroma) =>
              patch((prev) => ({
                ...prev,
                darkMode: { ...prev.darkMode, chroma },
              }))
            }
          />
          <SliderControl
          appearance="colors"
            label="Lightness correction"
            value={config.base.lightnessCorrection}
            min={0}
            max={1}
            step={0.01}
            formatValue={formatPercent}
            readOnly={!oklchEnabled}
            onChange={(lightnessCorrection) =>
              patch((prev) => ({
                ...prev,
                base: { ...prev.base, lightnessCorrection },
              }))
            }
          />
          <SliderControl
          appearance="colors"
            label="Chroma correction"
            value={config.base.chromaCorrection}
            min={0}
            max={1}
            step={0.01}
            formatValue={formatPercent}
            readOnly={!oklchEnabled}
            onChange={(chromaCorrection) =>
              patch((prev) => ({
                ...prev,
                base: { ...prev.base, chromaCorrection },
              }))
            }
          />
        </DemoControls>
        <PaletteStrip colors={colors} />
      </div>
      <div className="mx-auto w-[168px] shrink-0 sm:mx-0">
        <OklchPaletteWheel
          spec={spec}
          theme={DEMO_THEME}
          config={effective}
          size={168}
          interactive
          onChange={patch}
          className="aspect-square w-full"
        />
      </div>
    </DemoCard>
  )
}

export function ThematicEquivalenceDemo() {
  const spec = useMemo(() => createDemoBarSpec(8), [])
  const [config, patch] = usePaletteDemoState({
    startHue: 238,
    lightMode: { lightness: 0.83, chroma: 0.1 },
    darkMode: { lightness: 0.51, chroma: 0.08 },
  })
  const count = requiredColorCount(spec)
  const lightRow = useMemo(
    () => resolvePalettePreview(config, 'light', count, spec),
    [config, count, spec],
  )
  const darkRow = useMemo(
    () => resolvePalettePreview(config, 'dark', count, spec),
    [config, count, spec],
  )

  return (
    <DemoCard className="flex flex-col gap-3">
      <DemoControls>
      <SliderControl
        appearance="colors"
        label="Key rotation"
        value={config.startHue}
        min={0}
        max={360}
        step={1}
        formatValue={(v) => `${Math.round(v)}°`}
        onChange={(startHue) => patch((prev) => ({ ...prev, startHue }))}
      />
      </DemoControls>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:justify-between">
        <DemoControls className="shrink-0 sm:w-[231px]">
          <SliderControl
            appearance="colors"
            label="Light Lightness"
            value={config.lightMode.lightness}
            min={0.2}
            max={0.9}
            step={0.01}
            formatValue={formatPercent}
            onChange={(lightness) =>
              patch((prev) => ({
                ...prev,
                lightMode: { ...prev.lightMode, lightness },
              }))
            }
          />
          <SliderControl
            appearance="colors"
            label="Light Chroma"
            value={config.lightMode.chroma}
            min={0.02}
            max={0.28}
            step={0.01}
            formatValue={formatPercent}
            onChange={(chroma) =>
              patch((prev) => ({
                ...prev,
                lightMode: { ...prev.lightMode, chroma },
              }))
            }
          />
          <SliderControl
            appearance="colors"
            label="Dark Lightness"
            value={config.darkMode.lightness}
            min={0.2}
            max={0.9}
            step={0.01}
            formatValue={formatPercent}
            onChange={(lightness) =>
              patch((prev) => ({
                ...prev,
                darkMode: { ...prev.darkMode, lightness },
              }))
            }
          />
          <SliderControl
            appearance="colors"
            label="Dark Chroma"
            value={config.darkMode.chroma}
            min={0.02}
            max={0.28}
            step={0.01}
            formatValue={formatPercent}
            onChange={(chroma) =>
              patch((prev) => ({
                ...prev,
                darkMode: { ...prev.darkMode, chroma },
              }))
            }
          />
        </DemoControls>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
          <PaletteStrip colors={lightRow} className="min-h-[56px]" />
          <PaletteStrip colors={darkRow} className="min-h-[56px]" />
        </div>
      </div>
    </DemoCard>
  )
}

export function ColorOrderingDemo() {
  const spec = useMemo(() => createDemoBarSpec(8), [])
  const [config, patch] = usePaletteDemoState({
    darkMode: { lightness: 0.6, chroma: 0.11 },
  })
  const smart =
    config.hueLayout === 'greedy' && (config.paletteRevision ?? 1) >= 2
  const count = requiredColorCount(spec)
  const colors = useMemo(
    () => resolvePalettePreview(config, DEMO_THEME, count, spec),
    [config, count, spec],
  )

  return (
    <DemoCard className="flex flex-col gap-3 sm:flex-row sm:gap-2">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        <DemoControls>
        <SwitchRow
          label="Smart color ordering"
          checked={smart}
          onCheckedChange={(on) =>
            patch((prev) => ({
              ...prev,
              hueLayout: on ? 'greedy' : 'even',
              paletteRevision: 2,
            }))
          }
        />
        <SliderControl
          appearance="colors"
          label="Separation"
          value={Math.min(1, Math.max(0.25, config.distanceWeights.hue))}
          min={0.25}
          max={1}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}×`}
          onChange={(hue) =>
            patch((prev) => ({
              ...prev,
              distanceWeights: { ...prev.distanceWeights, hue },
            }))
          }
        />
        </DemoControls>
        <PaletteStrip colors={colors} showSequence />
      </div>
      <div className="mx-auto w-[168px] shrink-0 sm:mx-0">
        <OklchPaletteWheel
          spec={spec}
          theme={DEMO_THEME}
          config={config}
          size={168}
          interactive
          onChange={patch}
          className="aspect-square w-full"
        />
      </div>
    </DemoCard>
  )
}

export function AccessibilityDemo() {
  const [seriesCount] = useState(8)
  const spec = useMemo(() => createDemoBarSpec(seriesCount), [seriesCount])
  const [config, patch] = usePaletteDemoState()

  return (
    <DemoCard>
      <AccessibilityContrastPanel
        spec={spec}
        theme={DEMO_THEME}
        config={config}
        onChange={patch}
        layout="split"
      />
    </DemoCard>
  )
}

/** Canonical stops (light-oriented); dark preview via theme adaptation. */
const GRADIENT_DEMO_STOPS = {
  stops: [
    { position: 0, color: '#F2FFDC' },
    { position: 0.5, color: '#D5C366' },
    { position: 1, color: '#000000' },
  ],
} as const

const HEATMAP_DEMO_ROWS = 6
const HEATMAP_DEMO_COLS = 12
/** Target grid width; height follows 12:6 aspect for square cells. */
const HEATMAP_DEMO_GRID_WIDTH_PX = 384

function heatmapGridValues(rows: number, cols: number, seed: number): number[] {
  let s = seed
  const out: number[] = []
  for (let i = 0; i < rows * cols; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    out.push((s % 1000) / 10)
  }
  return out
}

type HeatmapDemoPreviewProps = {
  values: number[]
  domain: ReturnType<typeof domainFromValues>
  themed: HeatmapColorConfig
  previewDark: boolean
}

function HeatmapDemoPreview({
  values,
  domain,
  themed,
  previewDark,
}: HeatmapDemoPreviewProps) {
  return (
    <div className="ml-auto w-fit max-w-full shrink-0 self-start">
      <div
        className="grid max-w-full gap-[2px] overflow-hidden rounded-lg border border-border"
        style={{
          width: HEATMAP_DEMO_GRID_WIDTH_PX,
          maxWidth: '100%',
          aspectRatio: `${HEATMAP_DEMO_COLS} / ${HEATMAP_DEMO_ROWS}`,
          backgroundColor: previewDark ? '#0a0a0a' : '#f0f0f0',
          gridTemplateColumns: `repeat(${HEATMAP_DEMO_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${HEATMAP_DEMO_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {values.map((value, i) => {
          const fill = colorForHeatmapValue(value, domain, themed)
          const label = String(Math.round(value))
          return (
            <div
              key={i}
              className="flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[4px] px-px font-mono text-[11px] leading-none tabular-nums"
              style={{
                backgroundColor: fill,
                color: labelOnFill(fill),
              }}
              title={label}
            >
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GradientColorsDemo() {
  const [config, setConfig] = useState(() =>
    normalizeHeatmapColors({
      ...DEFAULT_HEATMAP_COLORS,
      darkMode: { lightness: 0.51, chroma: 0.08 },
      sequential: { stops: [...GRADIENT_DEMO_STOPS.stops] },
    }),
  )
  const [previewDark, setPreviewDark] = useState(true)
  const [oklchBlend, setOklchBlend] = useState(true)

  const themed = useMemo(() => {
    const withBlend = normalizeHeatmapColors({
      ...config,
      interpolation: {
        ...config.interpolation,
        colorBlend: oklchBlend ? 'oklch' : 'srgb',
      },
    })
    return applyHeatmapTheme(withBlend, previewDark ? 'dark' : 'light')
  }, [config, oklchBlend, previewDark])

  const strip = useMemo(
    () =>
      sampleGradientStrip(
        themed.sequential,
        themed.interpolation.colorBlend,
        48,
        themed.useStopAlpha,
      ),
    [themed],
  )

  const gridValues = useMemo(
    () => heatmapGridValues(HEATMAP_DEMO_ROWS, HEATMAP_DEMO_COLS, 7),
    [],
  )
  const domain = useMemo(() => domainFromValues(gridValues), [gridValues])

  const patch = (fn: (prev: HeatmapColorConfig) => HeatmapColorConfig) => {
    setConfig((prev) => normalizeHeatmapColors(fn(prev)))
  }

  const editorConfig = useMemo(
    () =>
      normalizeHeatmapColors({
        ...config,
        interpolation: {
          ...config.interpolation,
          colorBlend: oklchBlend ? 'oklch' : 'srgb',
        },
      }),
    [config, oklchBlend],
  )
  const editorTheme = previewDark ? 'dark' : 'light'
  const previewLight = !previewDark

  return (
    <div className={cn('w-full rounded-[14px]', previewLight && 'light')}>
      <DemoCard
        className={cn(
          'flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5',
          previewLight
            ? 'border-border bg-editor-shell'
            : 'border-white/10 bg-panel',
        )}
      >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <HeatmapGradientEditor
          gradient={config.sequential}
          colorBlend={editorConfig.interpolation.colorBlend}
          themeConfig={editorConfig}
          theme={editorTheme}
          showMirror={false}
          showStopList={false}
          onChange={(sequential) =>
            patch((prev) => ({ ...prev, sequential }))
          }
        />
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(to right, ${strip.join(', ')})`,
          }}
          aria-hidden
        />

        <DemoControls>
        <SwitchRow
          label="OKLCH color blend"
          checked={oklchBlend}
          onCheckedChange={setOklchBlend}
        />
        <SwitchRow
          label="Dark mode"
          checked={previewDark}
          onCheckedChange={setPreviewDark}
        />
        <SwitchRow
          label="Adaptive inversion"
          checked={config.adaptInversion !== false}
          onCheckedChange={(adaptInversion) =>
            patch((prev) => ({ ...prev, adaptInversion }))
          }
        />
        </DemoControls>
      </div>

      <HeatmapDemoPreview
        values={gridValues}
        domain={domain}
        themed={themed}
        previewDark={previewDark}
      />
      </DemoCard>
    </div>
  )
}
