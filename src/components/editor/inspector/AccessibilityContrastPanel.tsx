import { CaretRight, Check, X } from '@phosphor-icons/react'
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import {
  paletteAccessibilitySlots,
  resolveAccessibilityThresholds,
} from '../../../accessibility/chartContrastReport'
import { requiredColorCount, resolvePaletteSequence } from '../../../visualization-colors/resolve'
import { ColorSequenceDot } from './ColorSequenceDot'
import type { ChartTheme, VisualizationPaletteConfig } from '../../../visualization-colors/types'
import { SliderControl } from '../../ui/slider-control'
import { cn } from '../../../lib/utils'
import { InspectorReveal } from './InspectorReveal'

type AccessibilityContrastPanelProps = {
  spec: ChartSpec
  theme: ChartTheme
  config: VisualizationPaletteConfig
  onChange: (patch: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => void
}

function StatusBadge({
  pass,
  title,
}: {
  pass: boolean
  title: string
}) {
  return (
    <div
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full p-0.5',
        pass ? 'bg-[rgba(118,255,122,0.21)]' : 'bg-[rgba(255,142,142,0.21)]',
      )}
      title={title}
    >
      {pass ? (
        <Check size={14} weight="bold" className="text-foreground/90" aria-hidden />
      ) : (
        <X size={14} weight="bold" className="text-foreground/90" aria-hidden />
      )}
    </div>
  )
}

function MonitorRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid w-full min-w-0 grid-cols-[24px_minmax(0,1fr)] items-start gap-x-2 rounded-lg bg-control py-1 pl-2 pr-1">
      <span className="pt-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap justify-end gap-0.5">{children}</div>
    </div>
  )
}

export function AccessibilityContrastPanel({
  spec,
  theme,
  config,
  onChange,
}: AccessibilityContrastPanelProps) {
  const [thresholdOpen, setThresholdOpen] = useState(false)
  const thresholds = resolveAccessibilityThresholds(config)
  const colorCount = requiredColorCount(spec)
  const paletteSequence = useMemo(
    () => resolvePaletteSequence(config, theme, colorCount),
    [config, theme, colorCount],
  )
  const slots = useMemo(
    () => paletteAccessibilitySlots(spec, config, theme, colorCount),
    [spec, config, theme, colorCount],
  )

  const patchThreshold = (
    key: 'minRatioOnBackground' | 'minRatioOnBarText',
    value: number,
  ) => {
    onChange((prev) => ({
      ...prev,
      accessibility: {
        ...resolveAccessibilityThresholds(prev),
        [key]: value,
      },
    }))
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <MonitorRow label="Clr.">
        {paletteSequence.map(({ sequence, hex }) => (
          <ColorSequenceDot key={sequence} sequence={sequence} hex={hex} />
        ))}
      </MonitorRow>

      <MonitorRow label="Text">
        {slots.map((slot, i) =>
          slot.ratioOnBarText == null ? null : (
            <StatusBadge
              key={i}
              pass={slot.passOnBarText}
              title={`Color ${i + 1} · on-bar text ${slot.ratioOnBarText.toFixed(2)}:1 (min ${thresholds.minRatioOnBarText}:1)`}
            />
          ),
        )}
      </MonitorRow>

      <MonitorRow label="BG">
        {slots.map((slot, i) =>
          slot.ratioOnBackground == null ? null : (
            <StatusBadge
              key={i}
              pass={slot.passOnBackground}
              title={`Color ${i + 1} · on background ${slot.ratioOnBackground.toFixed(2)}:1 (min ${thresholds.minRatioOnBackground}:1)`}
            />
          ),
        )}
      </MonitorRow>

      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-lg bg-control px-2 py-1.5 transition-colors duration-100',
          !thresholdOpen && 'cursor-pointer hover:bg-inspector-section-hover',
        )}
        onClick={!thresholdOpen ? () => setThresholdOpen(true) : undefined}
        onKeyDown={
          !thresholdOpen
            ? (e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setThresholdOpen(true)
                }
              }
            : undefined
        }
        tabIndex={!thresholdOpen ? 0 : undefined}
        role={!thresholdOpen ? 'button' : undefined}
        aria-expanded={thresholdOpen}
      >
        {thresholdOpen ? (
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between text-left"
            onClick={() => setThresholdOpen(false)}
          >
            <span className="text-sm font-medium text-foreground/60">Accessibility Threshold</span>
            <CaretRight
              size={16}
              weight="bold"
              className="-rotate-90 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
              aria-hidden
            />
          </button>
        ) : (
          <div className="pointer-events-none flex w-full items-center justify-between text-left">
            <span className="text-sm font-medium text-foreground/60">Accessibility Threshold</span>
            <CaretRight
              size={16}
              weight="bold"
              className="rotate-90 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
              aria-hidden
            />
          </div>
        )}
        <InspectorReveal
          show={thresholdOpen}
          pullUpWhenClosed={false}
          className={thresholdOpen ? 'mt-2.5' : undefined}
          innerClassName="gap-1.5"
        >
            <SliderControl
              label="Text on viz (1:X)"
              value={thresholds.minRatioOnBarText}
              min={1}
              max={21}
              step={0.1}
              onChange={(v) => patchThreshold('minRatioOnBarText', v)}
            />
            <SliderControl
              label="Colors on bg (1:X)"
              value={thresholds.minRatioOnBackground}
              min={1}
              max={21}
              step={0.1}
              onChange={(v) => patchThreshold('minRatioOnBackground', v)}
            />
        </InspectorReveal>
      </div>
    </div>
  )
}
