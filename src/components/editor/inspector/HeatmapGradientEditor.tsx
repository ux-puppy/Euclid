import { ArrowsLeftRight, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  addGradientStop,
  normalizeGradientStops,
  mirrorGradient,
  removeGradientStopAt,
  sortStops,
  updateStopColor,
  updateStopPosition,
} from '../../../heatmap-colors/gradientStops'
import { sampleGradientAt, sampleGradientStrip } from '../../../heatmap-colors/resolve'
import type { HeatmapColorBlend, HeatmapGradient } from '../../../heatmap-colors/types'
import { cn } from '../../../lib/utils'
import { IroColorPicker } from '../../ui/iro-color-picker'
import { Button } from '../../ui/button'

type HeatmapGradientEditorProps = {
  gradient: HeatmapGradient
  colorBlend: HeatmapColorBlend
  onChange: (next: HeatmapGradient) => void
}

const DRAG_THRESHOLD_PX = 4

const barHandleClass =
  'h-[30px] w-3 rounded-lg border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.5)] p-0 min-h-0 min-w-0 bg-transparent'

/** Figma: end handles flush to bar edges; all vertically centered on padded gradient track. */
function handleAnchorStyle(position: number): CSSProperties {
  const p = Math.min(1, Math.max(0, position))
  const vertical: Pick<CSSProperties, 'top' | 'transform'> = {
    top: '50%',
    transform: 'translateY(-50%)',
  }
  if (p <= 0.0001) {
    return { left: 0, ...vertical }
  }
  if (p >= 0.9999) {
    return { left: '100%', top: '50%', transform: 'translate(-100%, -50%)' }
  }
  return { left: `${p * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }
}

type DragState = {
  index: number
  moved: boolean
  startX: number
  startY: number
  anchorColor: string
  anchorPosition: number
}

function findDraggedStopIndex(gradient: HeatmapGradient, anchor: DragState): number {
  const sorted = sortStops(normalizeGradientStops(gradient.stops))
  const byPos = sorted.findIndex(
    (s) =>
      s.color === anchor.anchorColor &&
      Math.abs(s.position - anchor.anchorPosition) < 0.002,
  )
  if (byPos >= 0) return byPos
  if (sorted[anchor.index]) return anchor.index
  return -1
}

export function HeatmapGradientEditor({
  gradient,
  colorBlend,
  onChange,
}: HeatmapGradientEditorProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const gradientRef = useRef(gradient)
  gradientRef.current = gradient
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const dragRef = useRef<DragState | null>(null)
  const stopCountRef = useRef(0)

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null)

  const stops = useMemo(
    () => sortStops(normalizeGradientStops(gradient.stops)),
    [gradient.stops],
  )
  stopCountRef.current = stops.length

  const barBackground = useMemo(() => {
    const samples = sampleGradientStrip({ stops }, colorBlend, 64)
    const step = 100 / Math.max(1, samples.length - 1)
    const parts = samples.map((c, i) => `${c} ${(i * step).toFixed(2)}%`)
    return `linear-gradient(to right, ${parts.join(', ')})`
  }, [stops, colorBlend])

  const pickStopAtClientX = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return 0.5
    const rect = bar.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        d.moved = true
        setDragIndex(d.index)
        setColorPickerIndex(null)
      }
      const n = stopCountRef.current
      if (d.moved) {
        const idx = findDraggedStopIndex(gradientRef.current, d)
        if (idx > 0 && idx < n - 1) {
          const t = pickStopAtClientX(e.clientX)
          const next = updateStopPosition(gradientRef.current, idx, t)
          gradientRef.current = next
          d.anchorPosition = t
          d.index = findDraggedStopIndex(next, d)
          onChangeRef.current(next)
        }
      }
    }

    const endDrag = () => {
      const d = dragRef.current
      if (d && !d.moved) {
        setColorPickerIndex(d.index)
      }
      dragRef.current = null
      setDragIndex(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [pickStopAtClientX])

  const onBarPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || dragRef.current) return
    const t = pickStopAtClientX(e.clientX)
    const near = stops.findIndex((s) => Math.abs(s.position - t) < 0.04)
    if (near >= 0) return

    const color = sampleGradientAt({ stops }, t, colorBlend)
    const next = addGradientStop(gradient, t, color)
    gradientRef.current = next
    onChange(next)

    const sorted = sortStops(normalizeGradientStops(next.stops))
    const index = sorted.findIndex(
      (s) => s.color === color && Math.abs(s.position - t) < 0.002,
    )
    if (index < 0) return

    e.preventDefault()
    setColorPickerIndex(null)
    dragRef.current = {
      index,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      anchorColor: color,
      anchorPosition: t,
    }
  }

  const onHandlePointerDown = (index: number, e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    setColorPickerIndex(null)
    const stop = stops[index]
    if (!stop) return
    dragRef.current = {
      index,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      anchorColor: stop.color,
      anchorPosition: stop.position,
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex w-full min-w-0 justify-end">
        <Button
          variant="control"
          size="sm"
          className="h-[30px] gap-1.5 px-2"
          title="Mirror gradient colors (swap low and high)"
          aria-label="Mirror gradient colors"
          onClick={() => onChange(mirrorGradient(gradient))}
        >
          <ArrowsLeftRight size={14} weight="bold" aria-hidden />
          Mirror
        </Button>
      </div>
      <div
        ref={barRef}
        className="relative flex w-full shrink-0 items-center overflow-visible rounded-lg p-0.5"
        style={{ background: barBackground }}
        role="presentation"
      >
        <div
          className="absolute inset-0 z-0 cursor-crosshair"
          onPointerDown={onBarPointerDown}
          aria-hidden
        />
        <div className="relative z-[1] h-[30px] w-full shrink-0 pointer-events-none" aria-hidden />
        {stops.map((stop, i) => {
          const isEnd = i === 0 || i === stops.length - 1
          const handleClass = cn(
            barHandleClass,
            'box-border',
            isEnd ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
            dragIndex === i && 'ring-2 ring-ring ring-offset-1 ring-offset-transparent',
          )

          return (
            <div
              key={`${i}-${stop.position.toFixed(4)}`}
              className="absolute z-[2] pointer-events-none"
              style={handleAnchorStyle(stop.position)}
            >
              <div
                className="pointer-events-auto relative h-[30px] w-3"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={handleClass}
                  title={`${Math.round(stop.position * 100)} — click for color${
                    isEnd ? '' : ', drag to move'
                  }`}
                  onPointerDown={(e) => onHandlePointerDown(i, e)}
                />
                {colorPickerIndex === i ? (
                  <IroColorPicker
                    key={`picker-${i}-${stop.position}`}
                    defaultOpen
                    value={stop.color}
                    label={`Stop at ${Math.round(stop.position * 100)}`}
                    className="pointer-events-none absolute inset-0"
                    triggerClassName="pointer-events-none h-full w-full min-h-0 min-w-0 rounded-lg border-0 p-0 opacity-0"
                    onChange={(c) => onChange(updateStopColor(gradient, i, c))}
                    onOpenChange={(open) => {
                      if (!open) setColorPickerIndex(null)
                    }}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2">
        {stops.map((stop, i) => {
          const isEnd = i === 0 || i === stops.length - 1
          const canRemove = stops.length > 2 && !isEnd
          return (
            <div
              key={`row-${i}-${stop.position}`}
              className="flex w-full min-w-0 items-center justify-between gap-2"
            >
              <span className="shrink-0 text-sm font-medium tabular-nums text-foreground/60">
                {Math.round(stop.position * 100)}
              </span>
              <div className="flex shrink-0 items-center gap-2.5">
                <IroColorPicker
                  variant="pill"
                  value={stop.color}
                  label={`Stop at ${Math.round(stop.position * 100)}`}
                  onChange={(c) => onChange(updateStopColor(gradient, i, c))}
                />
                <button
                  type="button"
                  disabled={!canRemove}
                  title={canRemove ? 'Remove stop' : 'End stops cannot be removed'}
                  onClick={() => canRemove && onChange(removeGradientStopAt(gradient, i))}
                  className={cn(
                    'flex h-[21px] w-[34px] shrink-0 items-center justify-center rounded-full border border-white/20',
                    'transition-colors duration-100',
                    canRemove
                      ? 'bg-black/10 hover:bg-white/10 text-muted-foreground'
                      : 'cursor-default bg-black/5 text-muted-foreground/40',
                  )}
                >
                  <X size={16} weight="regular" aria-hidden />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
