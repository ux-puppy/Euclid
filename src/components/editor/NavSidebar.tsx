import {
  ArrowLineUpRight,
  CaretRight,
  CompassTool,
  Envelope,
  LinkedinLogo,
  Lock,
  ArrowRight,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { OverlayScrollArea } from '../ui/overlay-scroll-area'
import { useEditorStore } from '../../store/editorStore'
import type { EditorChartId } from '../../chart-spec/types'
import { CHART_LABELS } from '../../store/editorStore'

const BAR_VARIANT_IDS: EditorChartId[] = ['classic', 'breakdown', 'hierarchy']

const NAV_WIDTH_PX = 177

const LOCKED_CHART_LABELS = [
  'Line Chart',
  'Pie Chart',
  'Sankey Chart',
  'Scatter Plot',
] as const

function lockedChartDevMessage(label: string): string {
  return `${label} is in development and not ready to use yet.`
}

function LockedChartNavItem({ label }: { label: string }) {
  const [tipOpen, setTipOpen] = useState(false)

  return (
    <Tooltip open={tipOpen} onOpenChange={setTipOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setTipOpen(true)}
          className={cn(
            'flex w-full h-[30px] items-center justify-between gap-2 rounded-[6px] px-2 text-sm font-medium transition-colors',
            'text-muted-foreground/80 hover:bg-control-hover hover:text-muted-foreground',
          )}
        >
          <span className="min-w-0 truncate">{label}</span>
          <Lock size={14} weight="bold" className="shrink-0 opacity-70" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        {lockedChartDevMessage(label)}
      </TooltipContent>
    </Tooltip>
  )
}

function NavChartButton({
  label,
  selected,
  onSelect,
  nested = false,
  disabled = false,
}: {
  label: string
  selected?: boolean
  onSelect?: () => void
  nested?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      title={disabled ? 'Coming soon' : undefined}
      className={cn(
        'w-full text-left h-[30px] rounded-[6px] text-sm font-medium transition-colors',
        nested ? 'pl-7 pr-2' : 'px-2',
        disabled &&
          'text-muted-foreground/80 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/80',
        !disabled &&
          selected &&
          'bg-segment-active text-segment-active-fg',
        !disabled &&
          !selected &&
          'text-foreground/50 hover:text-foreground/70 hover:bg-control-hover',
      )}
    >
      {label}
    </button>
  )
}

export function NavSidebar() {
  const selectedChart = useEditorStore((s) => s.selectedChart)
  const selectChart = useEditorStore((s) => s.selectChart)
  const [barChartsOpen, setBarChartsOpen] = useState(true)

  return (
    <aside
      style={{ width: NAV_WIDTH_PX }}
      className="shrink-0 flex flex-col h-full min-h-0 overflow-hidden p-2"
    >
      <OverlayScrollArea
        className="flex-1 min-h-0"
        viewportClassName="flex flex-col justify-between min-h-full"
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 px-1.5 py-1 text-muted-foreground">
            <CompassTool size={16} weight="regular" />
            <span className="text-sm font-medium text-foreground/50">Euclid</span>
          </div>

          <div className="space-y-0.5">
            <NavChartButton
              label={CHART_LABELS.palette}
              selected={selectedChart === 'palette'}
              onSelect={() => selectChart('palette')}
            />

            <button
              type="button"
              aria-expanded={barChartsOpen}
              onClick={() => setBarChartsOpen((open) => !open)}
              className={cn(
                'flex w-full h-[30px] items-center gap-1 rounded-[6px] px-2 text-sm font-medium transition-colors',
                'text-foreground/50 hover:text-foreground/70 hover:bg-control-hover',
              )}
            >
              <CaretRight
                size={14}
                weight="bold"
                className={cn(
                  'shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none',
                  barChartsOpen && 'rotate-90',
                )}
                aria-hidden
              />
              <span>Bar charts</span>
            </button>

            {barChartsOpen ? (
              <div className="space-y-0.5 border-l border-border ml-3.5 pl-1">
                {BAR_VARIANT_IDS.map((id) => (
                  <NavChartButton
                    key={id}
                    label={CHART_LABELS[id]}
                    selected={selectedChart === id}
                    onSelect={() => selectChart(id)}
                    nested
                  />
                ))}
              </div>
            ) : null}

            <NavChartButton
              label={CHART_LABELS.heatmap}
              selected={selectedChart === 'heatmap'}
              onSelect={() => selectChart('heatmap')}
            />

            {LOCKED_CHART_LABELS.map((label) => (
              <LockedChartNavItem key={label} label={label} />
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-panel p-2 space-y-4 text-[11px]">
          <div className="space-y-1 text-muted-foreground font-medium">
            <p className="text-foreground/60">Made by Satyam Chandra</p>
            <p>This tool is free to use.</p>
            <a
              href="#/case-study"
              className="inline-flex items-center gap-1 text-foreground/80 underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
            >
              <CompassTool size={12} aria-hidden />
              Color system case study
            </a>
          </div>
          <div className="flex items-center justify-between border border-border rounded-lg p-2 text-muted-foreground">
            <span>Other Tools</span>
            <ArrowRight size={14} />
          </div>
          <div className="flex gap-1.5">
            {[ArrowLineUpRight, LinkedinLogo, Envelope].map((Icon, i) => (
              <div
                key={i}
                className="flex-1 flex items-center justify-center border border-border rounded-lg p-2 text-muted-foreground"
              >
                <Icon size={14} />
              </div>
            ))}
          </div>
        </div>
      </OverlayScrollArea>
    </aside>
  )
}
