import { useEffect, useRef } from 'react'
import { scaleCurveSamples } from '../../../heatmap-colors/interpolation'
import type { HeatmapInterpolation } from '../../../heatmap-colors/types'
import { controlSurface } from '../../../lib/controlSurface'
import { inspectorFieldGap } from './inspectorStyles'
import { cn } from '../../../lib/utils'

type HeatmapScaleCurveGraphProps = {
  interpolation: HeatmapInterpolation
  className?: string
}

function drawScaleCurve(canvas: HTMLCanvasElement, interpolation: HeatmapInterpolation) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const size = canvas.clientWidth
  if (size <= 0) return

  canvas.width = size * dpr
  canvas.height = size * dpr

  const w = size
  const h = size
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const pad = 8
  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(128,128,128,0.35)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(pad, h - pad)
  ctx.lineTo(w - pad, pad)
  ctx.stroke()
  ctx.setLineDash([])

  const pts = scaleCurveSamples(interpolation, 64)
  ctx.strokeStyle = 'rgba(200,200,200,0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  pts.forEach((p, i) => {
    const x = pad + p.x * (w - pad * 2)
    const y = h - pad - p.y * (h - pad * 2)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
}

export function HeatmapScaleCurveGraph({ interpolation, className }: HeatmapScaleCurveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const paint = () => drawScaleCurve(canvas, interpolation)
    paint()

    const ro = new ResizeObserver(() => paint())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [interpolation])

  return (
    <div className={cn('w-full min-w-0 rounded-lg px-2 py-2', inspectorFieldGap, controlSurface, className)}>
      <p className="text-[10px] text-muted-foreground">Scale mapping (dashed = linear)</p>
      <div ref={wrapRef} className="w-full aspect-square">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded border border-border bg-background/50 block"
          aria-label="Scale mapping curve"
        />
      </div>
    </div>
  )
}
