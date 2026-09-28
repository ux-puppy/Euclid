import {
  ArrowLineUpRight,
  CompassTool,
  Envelope,
  LinkedinLogo,
  ArrowRight,
} from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { OverlayScrollArea } from '../ui/overlay-scroll-area'
import { useEditorStore } from '../../store/editorStore'
import type { ChartVariant } from '../../chart-spec/types'

const variants: { id: ChartVariant; label: string }[] = [
  { id: 'classic', label: 'Bar Chart' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'hierarchy', label: 'Hierarchy' },
]

type NavSidebarProps = {
  width: number
}

export function NavSidebar({ width }: NavSidebarProps) {
  const variant = useEditorStore((s) => s.spec.variant)
  const selectVariant = useEditorStore((s) => s.selectVariant)

  return (
    <aside
      style={{ width }}
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
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVariant(v.id)}
                  className={cn(
                    'w-full text-left h-[30px] px-2 rounded-[6px] text-sm font-medium transition-colors',
                    variant === v.id
                      ? 'bg-accent text-foreground'
                      : 'text-foreground/50 hover:text-foreground/70 hover:bg-control-hover',
                  )}
                >
                  {v.label}
                </button>
              ))}
              <button
                type="button"
                disabled
                title="Coming soon"
                className="w-full text-left h-[30px] px-2 rounded-[6px] text-sm font-medium text-muted-foreground/80 cursor-not-allowed"
              >
                Pie Chart
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="w-full text-left h-[30px] px-2 rounded-[6px] text-sm font-medium text-muted-foreground/80 cursor-not-allowed"
              >
                Heatmap
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-panel p-2 space-y-4 text-[11px]">
            <div className="space-y-1 text-muted-foreground font-medium">
              <p className="text-foreground/60">Made by Satyam Chandra</p>
              <p>This tool is free to use.</p>
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
