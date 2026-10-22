import { MagnifyingGlassMinus, MagnifyingGlassPlus, Play } from '@phosphor-icons/react'
import { useRef } from 'react'
import { ChartCanvas, type ChartCanvasHandle } from './ChartCanvas'
import { FloatingPaletteWheel } from './FloatingPaletteWheel'
import { PalettePane } from './PalettePane'
import {
  useEditorStore,
  CHART_LABELS,
} from '../../store/editorStore'
import type { ChartVariant } from '../../chart-spec/types'
import { Button } from '../ui/button'
import { SwitchRow } from './inspector/SwitchRow'
import { cn } from '../../lib/utils'
import { EDITOR_PANEL_SHELL_BG, EDITOR_PANEL_SHELL_RADIUS } from './editorShellChrome'
const PREVIEW_CHARTS: (ChartVariant | 'heatmap')[] = [
  'classic',
  'breakdown',
  'hierarchy',
  'heatmap',
]

const PREVIEW_GALLERY_CARD_RADIUS_PX = 10

export function PreviewPane() {
  const canvasRef = useRef<ChartCanvasHandle>(null)
  const targetZoom = useEditorStore((s) => s.ui.targetZoom)
  const zoomIn = useEditorStore((s) => s.zoomIn)
  const zoomOut = useEditorStore((s) => s.zoomOut)
  const zoomToFit = useEditorStore((s) => s.zoomToFit)
  const zoomTo100 = useEditorStore((s) => s.zoomTo100)
  const spec = useEditorStore((s) => s.spec)
  const specsByVariant = useEditorStore((s) => s.specsByVariant)
  const heatmapSpec = useEditorStore((s) => s.heatmapSpec)
  const selectedChart = useEditorStore((s) => s.selectedChart)
  const showAllCharts = useEditorStore((s) => s.ui.previewShowAllCharts)
  const setPreviewShowAllCharts = useEditorStore((s) => s.setPreviewShowAllCharts)
  const selectChart = useEditorStore((s) => s.selectChart)
  const expandAll = useEditorStore((s) => s.expandAll)
  const collapseAll = useEditorStore((s) => s.collapseAll)
  const beginTreeLayoutAnim = useEditorStore((s) => s.beginTreeLayoutAnim)
  const replayAnimation = useEditorStore((s) => s.replayAnimation)

  const withTreeLayoutAnim = (action: () => void) => {
    beginTreeLayoutAnim(canvasRef.current?.getDisplaySceneHeight() ?? 400)
    action()
  }
  const showExpand =
    spec.layout.mode === 'list' &&
    spec.layout.showExpandAllControl &&
    spec.data.shape === 'tree'

  const zoomPct = Math.round(targetZoom * 100)
  const isPaletteView = selectedChart === 'palette'

  return (
    <div
      className={cn(
        'flex flex-1 flex-col min-w-0 h-full min-h-0 overflow-hidden',
        EDITOR_PANEL_SHELL_BG,
        EDITOR_PANEL_SHELL_RADIUS,
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 min-h-[42px] flex-wrap">
        <span className="text-sm text-muted-foreground font-medium">
          {isPaletteView ? 'Palette' : 'Chart Preview Space'}
        </span>
        {!isPaletteView && (
          <div className="flex items-center min-w-[200px]">
            <SwitchRow
              label="Show all charts"
              checked={showAllCharts}
              onCheckedChange={setPreviewShowAllCharts}
            />
          </div>
        )}
        {!isPaletteView && (
          <div className="ml-auto flex items-center gap-1 flex-wrap justify-end">
            <span className="text-xs font-mono text-muted-foreground w-10 text-center tabular-nums">
              {zoomPct}%
            </span>
            <Button size="iconSm" variant="ghost" onClick={zoomOut} title="Zoom out">
              <MagnifyingGlassMinus size={14} />
            </Button>
            <Button size="iconSm" variant="ghost" onClick={zoomIn} title="Zoom in">
              <MagnifyingGlassPlus size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => zoomToFit(canvasRef.current?.getFitZoom() ?? 1)}
            >
              Fit
            </Button>
            <Button size="sm" variant="ghost" onClick={zoomTo100}>
              100%
            </Button>
            <Button
              size="iconSm"
              variant="ghost"
              onClick={() =>
                spec.variant === 'hierarchy'
                  ? withTreeLayoutAnim(replayAnimation)
                  : replayAnimation()
              }
              title="Replay animation"
            >
              <Play size={14} />
            </Button>
            {showExpand && (
              <>
                <Button size="sm" variant="outline" onClick={() => withTreeLayoutAnim(expandAll)}>
                  Expand all
                </Button>
                <Button size="sm" variant="outline" onClick={() => withTreeLayoutAnim(collapseAll)}>
                  Collapse all
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative flex flex-1 min-h-0 min-w-0 flex-col">
      {isPaletteView ? (
        <PalettePane />
      ) : showAllCharts ? (
        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden p-3 box-border">
            {PREVIEW_CHARTS.map((chartId) => {
              const chartSpec =
                chartId === 'heatmap' ? heatmapSpec : specsByVariant[chartId]
              const selected = selectedChart === chartId
              return (
                <div
                  key={chartId}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectChart(chartId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectChart(chartId)
                    }
                  }}
                  className={cn(
                    'flex min-h-0 flex-1 basis-0 flex-col border-2 overflow-hidden transition-colors cursor-pointer outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel',
                    selected
                      ? 'border-foreground/20 bg-panel'
                      : 'border-border/60 bg-panel/40 hover:border-border hover:bg-panel/70',
                  )}
                  style={{ borderRadius: PREVIEW_GALLERY_CARD_RADIUS_PX }}
                >
                  <div
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium border-b border-border shrink-0',
                      selected ? 'text-foreground bg-accent/40' : 'text-muted-foreground',
                    )}
                  >
                    {CHART_LABELS[chartId]}
                    {selected ? ' · selected' : ''}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">
                    <ChartCanvas
                      spec={chartSpec}
                      interactive={selected}
                      padded={false}
                      allowZoomWheel
                      ref={selected ? canvasRef : undefined}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      ) : (
        <ChartCanvas ref={canvasRef} />
      )}
      <FloatingPaletteWheel />
      </div>
    </div>
  )
}
