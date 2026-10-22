import { CaretRight, Check, X } from '@phosphor-icons/react'
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import {
  paletteAccessibilitySlots,
  resolveAccessibilityThresholds,
} from '../../../accessibility/chartContrastReport'
import { requiredColorCount, resolvePaletteSequence } from '../../../visualization-colors/resolve'
import { ColorSequenceDot } from './ColorSequenceDot'
import { buildNudgedPaletteFills } from '../../../visualization-colors/accessibilityNudge'
import { normalizePaletteConfig } from '../../../visualization-colors/defaults'
import type { ChartTheme, VisualizationPaletteConfig } from '../../../visualization-colors/types'
import { Button } from '../../ui/button'
import { SliderControl } from '../../ui/slider-control'
import { ControlTooltip } from '../../ui/tooltip'
import { cn } from '../../../lib/utils'
import { InspectorReveal } from './InspectorReveal'
import { colorsInspectorTooltips as T } from './colorsInspectorTooltips'
import { inspectorStack, inspectorStackGap } from './inspectorStyles'

type AccessibilityContrastPanelProps = {
  spec: ChartSpec
  theme: ChartTheme
  config: VisualizationPaletteConfig
  onChange: (patch: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => void
}

function StatusBadge({
  pass,
  tooltip,
}: {
  pass: boolean
  tooltip: string
}) {
  return (
    <ControlTooltip content={tooltip} side="top">
      <div
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full p-0.5',
          pass ? 'bg-[rgba(118,255,122,0.21)]' : 'bg-[rgba(255,142,142,0.21)]',
        )}
      >
        {pass ? (
          <Check size={14} weight="bold" className="text-foreground/90" aria-hidden />
        ) : (
          <X size={14} weight="bold" className="text-foreground/90" aria-hidden />
        )}
      </div>
    </ControlTooltip>
  )
}

function MonitorRow({
  label,
  tooltip,
  children,
}: {
  label: string
  tooltip?: string
  children: ReactNode
}) {
  return (
    <div className="grid w-full min-w-0 grid-cols-[24px_minmax(0,1fr)] items-start gap-x-2 rounded-lg bg-control py-1 pl-2 pr-1">
      <ControlTooltip content={tooltip} side="top" align="start">
        <span className="pt-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
      </ControlTooltip>
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
    () => resolvePaletteSequence(config, theme, colorCount, spec),
    [config, theme, colorCount, spec],
  )
  const slots = useMemo(
    () => paletteAccessibilitySlots(spec, config, theme, colorCount),
    [spec, config, theme, colorCount],
  )
  const hasFailingSlot = slots.some(
    (slot) =>
      slot.ratioOnBackground != null &&
      (!slot.passOnBackground || !slot.passOnBarText),
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

  const applyAccessibilityNudge = () => {
    onChange((prev) =>
      normalizePaletteConfig({
        ...prev,
        accessibility: {
          ...resolveAccessibilityThresholds(prev),
          nudgedFills: buildNudgedPaletteFills(prev, spec, theme, colorCount),
        },
      }),
    )
  }

  return (
    <div className={inspectorStack}>
      <MonitorRow label="Clr." tooltip={T.accessibility.rowColors}>
        {paletteSequence.map(({ sequence, hex }) => (
          <ColorSequenceDot
            key={sequence}
            sequence={sequence}
            hex={hex}
            title={T.accessibility.colorDot(sequence)}
          />
        ))}
      </MonitorRow>

      <MonitorRow label="Text" tooltip={T.accessibility.rowText}>
        {slots.map((slot, i) =>
          slot.ratioOnBarText == null ? null : (
            <StatusBadge
              key={i}
              pass={slot.passOnBarText}
              tooltip={`Color ${i + 1} · on-bar text ${slot.ratioOnBarText.toFixed(2)}:1 (min ${thresholds.minRatioOnBarText}:1)`}
            />
          ),
        )}
      </MonitorRow>

      <MonitorRow label="BG" tooltip={T.accessibility.rowBackground}>
        {slots.map((slot, i) =>
          slot.ratioOnBackground == null ? null : (
            <StatusBadge
              key={i}
              pass={slot.passOnBackground}
              tooltip={`Color ${i + 1} · on background ${slot.ratioOnBackground.toFixed(2)}:1 (min ${thresholds.minRatioOnBackground}:1)`}
            />
          ),
        )}
      </MonitorRow>

      <ControlTooltip
        content={hasFailingSlot ? T.accessibility.adjustEnabled : T.accessibility.adjustDisabled}
        side="top"
      >
        <span className="inline-flex w-full min-w-0">
          <Button
            variant="control"
            className="h-[30px] w-full justify-center text-sm font-normal"
            disabled={!hasFailingSlot}
            onClick={applyAccessibilityNudge}
          >
            Adjust colors to meet threshold
          </Button>
        </span>
      </ControlTooltip>

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
            <ControlTooltip content={T.accessibility.thresholdSection} side="top" align="start">
              <span className="text-sm font-medium text-foreground/60">Accessibility Threshold</span>
            </ControlTooltip>
            <CaretRight
              size={16}
              weight="bold"
              className="-rotate-90 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
              aria-hidden
            />
          </button>
        ) : (
          <div className="pointer-events-none flex w-full items-center justify-between text-left">
            <ControlTooltip content={T.accessibility.thresholdSection} side="top" align="start">
              <span className="pointer-events-auto text-sm font-medium text-foreground/60">
                Accessibility Threshold
              </span>
            </ControlTooltip>
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
          animated
          className={thresholdOpen ? 'mt-2.5' : undefined}
          innerClassName={inspectorStackGap}
        >
            <SliderControl
              label="Text on viz (1:X)"
              tooltip={T.accessibility.textOnViz}
              value={thresholds.minRatioOnBarText}
              min={1}
              max={21}
              step={0.1}
              onChange={(v) => patchThreshold('minRatioOnBarText', v)}
            />
            <SliderControl
              label="Colors on bg (1:X)"
              tooltip={T.accessibility.colorsOnBg}
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
