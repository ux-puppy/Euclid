import bezierEasing from 'bezier-easing'
import { useEffect, useRef } from 'react'
import { cn } from '../../../lib/utils'
import type { Bezier4 } from '../../../chart-spec/easingPresets'
import { controlSurface } from '../../../lib/controlSurface'
import { inspectorFieldGap } from './inspectorStyles'
import { NumberInput } from '../../ui/number-input'

type BezierEasingControlProps = {
  value: Bezier4
  onChange: (next: Bezier4) => void
}

function drawCurve(canvas: HTMLCanvasElement, value: Bezier4) {
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
  ctx.beginPath()
  ctx.moveTo(pad, h - pad)
  ctx.lineTo(w - pad, pad)
  ctx.stroke()

  const ease = bezierEasing(...value)
  ctx.strokeStyle = 'rgba(200,200,200,0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= 64; i++) {
    const t = i / 64
    const y = ease(t)
    const x = pad + t * (w - pad * 2)
    const py = h - pad - y * (h - pad * 2)
    if (i === 0) ctx.moveTo(x, py)
    else ctx.lineTo(x, py)
  }
  ctx.stroke()

  const [x1, y1, x2, y2] = value
  const sx = pad
  const sy = h - pad
  const ex = w - pad
  const ey = pad
  const c1x = sx + x1 * (ex - sx)
  const c1y = sy - y1 * (sy - ey)
  const c2x = sx + x2 * (ex - sx)
  const c2y = sy - y2 * (sy - ey)

  ctx.strokeStyle = 'rgba(120,120,255,0.5)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(c1x, c1y)
  ctx.lineTo(c2x, c2y)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = 'rgba(180,180,255,0.9)'
  ;[
    [c1x, c1y],
    [c2x, c2y],
  ].forEach(([cx, cy]) => {
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function BezierEasingControl({ value, onChange }: BezierEasingControlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const paint = () => drawCurve(canvas, value)
    paint()

    const ro = new ResizeObserver(() => paint())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [value])

  const labels = ['x1', 'y1', 'x2', 'y2'] as const

  return (
    <div className={cn('w-full min-w-0 rounded-lg px-2 py-2', inspectorFieldGap, controlSurface)}>
      <div ref={wrapRef} className="w-full aspect-square">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded border border-border bg-background/50 block"
          aria-label="Easing curve preview"
        />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {labels.map((label, i) => (
          <label key={label} className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
            {label}
            <NumberInput
              value={value[i]!}
              min={0}
              max={1}
              step={0.01}
              onChange={(n) => {
                const next = [...value] as Bezier4
                next[i] = n
                onChange(next)
              }}
              ariaLabel={`Bezier ${label}`}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
