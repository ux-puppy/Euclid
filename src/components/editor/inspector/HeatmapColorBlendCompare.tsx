import { useEffect, useMemo, useRef } from 'react'
import { blendDifferenceSmoothCurve, gradientStripCss } from '../../../heatmap-colors/blendCompare'
import { sampleGradientStrip } from '../../../heatmap-colors/resolve'
import type { HeatmapColorBlend, HeatmapGradient } from '../../../heatmap-colors/types'
import { controlSurface } from '../../../lib/controlSurface'
import { cn } from '../../../lib/utils'
import { InspectorSelect } from './InspectorSelect'
import { inspectorFieldGap } from './inspectorStyles'

type HeatmapColorBlendCompareProps = {
  gradient: HeatmapGradient
  colorBlend: HeatmapColorBlend
  onColorBlendChange: (blend: HeatmapColorBlend) => void
  className?: string
}

function drawDifferenceCurve(
  canvas: HTMLCanvasElement,
  samples: { x: number; y: number }[],
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (w <= 0 || h <= 0) return

  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const pad = 8
  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(128,128,128,0.35)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(pad, h - pad)
  ctx.lineTo(w - pad, h - pad)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(200,200,200,0.9)'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  samples.forEach((p, i) => {
    const x = pad + p.x * (w - pad * 2)
    const y = h - pad - p.y * (h - pad * 2)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
}

function PreviewStrip({ label, background }: { label: string; background: string }) {
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <div className="relative h-[14px] w-full overflow-hidden rounded-md border border-border/60 bg-transparent">
        <div
          className="absolute inset-y-0 -left-px w-[calc(100%+2px)]"
          style={{ backgroundImage: background }}
          aria-hidden
        />
      </div>
    </div>
  )
}

export function HeatmapColorBlendCompare({
  gradient,
  colorBlend,
  onColorBlendChange,
  className,
}: HeatmapColorBlendCompareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const oklchBg = useMemo(
    () => gradientStripCss(sampleGradientStrip(gradient, 'oklch', 64)),
    [gradient],
  )
  const srgbBg = useMemo(
    () => gradientStripCss(sampleGradientStrip(gradient, 'srgb', 64)),
    [gradient],
  )
  const diffCurve = useMemo(() => blendDifferenceSmoothCurve(gradient, 32, 64), [gradient])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const paint = () => drawDifferenceCurve(canvas, diffCurve)
    paint()

    const ro = new ResizeObserver(() => paint())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [diffCurve])

  return (
    <div className={cn('w-full min-w-0 rounded-lg px-2 py-2', inspectorFieldGap, controlSurface, className)}>
      <InspectorSelect
        label="Color blend between stops"
        value={colorBlend}
        options={[
          { value: 'oklch', label: 'OKLCH' },
          { value: 'srgb', label: 'sRGB' },
        ]}
        onChange={(v) => onColorBlendChange(v as HeatmapColorBlend)}
        appearance="colors"
      />

      <div className="flex gap-2 w-full min-w-0">
        <PreviewStrip label="OKLCH" background={oklchBg} />
        <PreviewStrip label="sRGB" background={srgbBg} />
      </div>

      <div ref={wrapRef} className="w-full h-14">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-md border border-border bg-background/50 block"
          aria-label="OKLCH versus sRGB difference along gradient"
        />
      </div>
    </div>
  )
}
