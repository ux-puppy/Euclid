import { useCallback, useEffect, useRef, useState } from 'react'
import {
  beginCoalescedInteraction,
  endCoalescedInteraction,
  flushCoalescedCommit,
  scheduleCoalescedCommit,
} from '../../store/interactionCommit'
import { cn } from '../../lib/utils'
import { ControlTooltip } from './tooltip'

type SliderControlProps = {
  label: string
  /** Native hover tooltip for the whole control row. */
  tooltip?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  /** Colors tab: row/fill stay on control; hover uses border only. */
  appearance?: 'default' | 'colors'
  formatValue?: (value: number) => string
  readOnly?: boolean
}

/** Matches Figma: Default → Hover → Pressed (drag) → Typing (value entry). */
type SliderVisualState = 'default' | 'hover' | 'pressed' | 'typing'

const DRAG_THRESHOLD_PX = 3

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function snapToStep(n: number, step: number, min: number) {
  if (step <= 0) return n
  const steps = Math.round((n - min) / step)
  return min + steps * step
}

function decimalPlacesForStep(step: number) {
  const stepStr = String(step)
  if (!stepStr.includes('.')) return 0
  return stepStr.split('.')[1]?.length ?? 0
}

function formatSliderValue(n: number, step: number) {
  const decimals = decimalPlacesForStep(step)
  if (decimals === 0) return String(Math.round(n))
  return n.toFixed(decimals)
}

function valueRatio(value: number, min: number, max: number) {
  if (max <= min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

function resolveVisualState(
  editing: boolean,
  dragging: boolean,
  hovered: boolean,
): SliderVisualState {
  if (editing) return 'typing'
  if (dragging) return 'pressed'
  if (hovered) return 'hover'
  return 'default'
}

const rowBg: Record<SliderVisualState, string> = {
  default: 'bg-control',
  hover: 'bg-panel-elevated',
  pressed: 'bg-control',
  typing: 'bg-control',
}

const fillBg: Record<Exclude<SliderVisualState, 'typing'>, string> = {
  default: 'bg-control',
  hover: 'bg-panel-elevated',
  pressed: 'bg-panel-elevated',
}

const handleBorder: Record<Exclude<SliderVisualState, 'typing'>, string> = {
  default: 'border-foreground/15',
  hover: 'border-foreground/15',
  pressed: 'border-foreground',
}

const labelText: Record<SliderVisualState, string> = {
  default: 'text-foreground/60',
  hover: 'text-foreground',
  pressed: 'text-foreground/20',
  typing: 'text-foreground',
}

const valueText: Record<SliderVisualState, string> = {
  default: 'text-foreground/60',
  hover: 'text-foreground',
  pressed: 'text-foreground',
  typing: 'text-foreground',
}

const fillBgColors: Record<Exclude<SliderVisualState, 'typing'>, string> = {
  default: 'bg-control',
  hover: 'bg-control',
  pressed: 'bg-panel-elevated',
}

export function SliderControl({
  label,
  tooltip,
  value,
  min,
  max,
  step = 1,
  onChange,
  appearance = 'default',
  formatValue,
  readOnly = false,
}: SliderControlProps) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [editing, setEditing] = useState(false)
  /** Local value while dragging — avoids store/chart work on every pointer move. */
  const [dragValue, setDragValue] = useState<number | null>(null)
  const format = formatValue ?? ((n: number) => formatSliderValue(n, step))
  const [text, setText] = useState(() => format(value))

  const trackRef = useRef<HTMLDivElement>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const pendingDragValue = useRef<number | null>(null)
  const pointerSession = useRef<{
    pointerId: number
    startX: number
    dragged: boolean
  } | null>(null)

  const displayValue = dragValue ?? value
  const visual = resolveVisualState(editing, dragging, hovered)
  const ratio = valueRatio(displayValue, min, max)

  useEffect(() => {
    if (!editing && dragValue === null) setText(format(value))
  }, [value, editing, dragValue, format])

  const normalize = useCallback(
    (next: number) => clamp(snapToStep(next, step, min), min, max),
    [min, max, step],
  )

  const commitToParent = useCallback(
    (v: number) => {
      onChange(v)
    },
    [onChange],
  )

  const setValueLive = useCallback(
    (next: number) => {
      const v = normalize(next)
      flushCoalescedCommit()
      commitToParent(v)
      setDragValue(null)
      pendingDragValue.current = null
      setText(format(v))
    },
    [commitToParent, format, normalize],
  )

  const setValueWhileDragging = useCallback(
    (next: number) => {
      const v = normalize(next)
      setDragValue(v)
      setText(format(v))
      pendingDragValue.current = v
      scheduleCoalescedCommit(() => {
        const pending = pendingDragValue.current
        if (pending != null) commitToParent(pending)
      })
    },
    [commitToParent, format, normalize],
  )

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return displayValue
      const rect = track.getBoundingClientRect()
      if (rect.width <= 0) return displayValue
      const t = clamp((clientX - rect.left) / rect.width, 0, 1)
      return min + t * (max - min)
    },
    [displayValue, max, min],
  )

  const commitText = () => {
    const trimmed = text.trim()
    if (trimmed === '') {
      setText(format(value))
      return
    }
    const n = Number(trimmed)
    if (Number.isNaN(n)) {
      setText(format(value))
      return
    }
    setValueLive(n)
  }

  const enterValueEntry = useCallback(() => {
    const input = valueInputRef.current
    if (!input) return
    input.focus()
    requestAnimationFrame(() => input.select())
  }, [])

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = pointerSession.current
    if (!session || session.pointerId !== e.pointerId) return

    const wasDrag = session.dragged
    pointerSession.current = null
    setDragging(false)

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (wasDrag) {
      const v = pendingDragValue.current
      endCoalescedInteraction(() => {
        if (v != null) commitToParent(v)
      })
      pendingDragValue.current = null
      setDragValue(null)
    }

    if (!wasDrag && !readOnly) {
      enterValueEntry()
    }
  }

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || e.button !== 0) return
    if (editing && (e.target as HTMLElement).closest('[data-slider-value]')) return

    e.currentTarget.setPointerCapture(e.pointerId)
    pointerSession.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      dragged: false,
    }
  }

  const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = pointerSession.current
    if (!session || session.pointerId !== e.pointerId) return

    const dx = e.clientX - session.startX
    if (!session.dragged) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return
      session.dragged = true
      setDragging(true)
      beginCoalescedInteraction()
      if (editing) {
        commitText()
        valueInputRef.current?.blur()
        setEditing(false)
      }
    }

    setValueWhileDragging(valueFromClientX(e.clientX))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || editing) return
    let delta = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -step
    else if (e.key === 'PageUp') delta = step * 10
    else if (e.key === 'PageDown') delta = -step * 10
    else if (e.key === 'Home') setValueLive(min)
    else if (e.key === 'End') setValueLive(max)
    else if (e.key === 'Enter') {
      enterValueEntry()
      return
    } else return

    e.preventDefault()
    if (e.key !== 'Home' && e.key !== 'End') setValueLive(displayValue + delta)
  }

  const fillWidth = ratio <= 0 ? '2px' : `${ratio * 100}%`
  const showFill = visual !== 'typing'
  const fillVisual = visual === 'typing' ? 'default' : visual
  const isColors = appearance === 'colors'
  const activeRowBg = isColors ? 'bg-control' : rowBg[visual]
  const activeFillBg = isColors ? fillBgColors[fillVisual] : fillBg[fillVisual]
  const showHoverBorder =
    isColors && hovered && visual !== 'typing' && !dragging

  const slider = (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={readOnly || editing ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={displayValue}
      aria-readonly={readOnly || undefined}
      className={cn(
        'relative box-border h-[30px] w-full min-w-0 overflow-hidden rounded-lg border border-transparent px-2 py-1.5 outline-none',
        'select-none touch-none transition-colors duration-100',
        activeRowBg,
        (visual === 'typing' || showHoverBorder || (isColors && dragging)) &&
          'border-foreground/20',
        dragging && !readOnly && 'cursor-ew-resize',
        readOnly && 'opacity-90',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        if (pointerSession.current === null) setDragging(false)
      }}
      onPointerDown={onTrackPointerDown}
      onPointerMove={onTrackPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 top-1/2 box-border h-[31px] -translate-y-1/2 border-r-2 border-solid',
          dragging ? 'transition-none' : 'transition-[width,opacity,background-color,border-color] duration-100',
          activeFillBg,
          handleBorder[fillVisual],
          !showFill && 'opacity-0',
        )}
        style={{ width: fillWidth, minWidth: ratio > 0 ? undefined : 0 }}
      />

      <div className="pointer-events-none relative grid h-full min-w-0 -translate-y-px grid-cols-[3fr_1fr] items-center gap-[10px] text-sm leading-normal">
        <span
          className={cn(
            'min-w-0 truncate font-medium transition-colors duration-100',
            labelText[visual],
          )}
        >
          {label}
        </span>
        <input
          ref={valueInputRef}
          data-slider-value
          type="text"
          inputMode="decimal"
          value={text}
          aria-label={`${label} value`}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false)
            commitText()
          }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              setText(format(value))
              e.currentTarget.blur()
            }
          }}
          className={cn(
            'euclid-no-spin min-w-0 w-full border-0 bg-transparent p-0 text-right',
            'font-mono text-sm font-medium outline-none transition-colors duration-100',
            valueText[visual],
            editing ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        />
      </div>
    </div>
  )

  return (
    <ControlTooltip content={dragging || editing ? undefined : tooltip} side="top" align="start">
      {slider}
    </ControlTooltip>
  )
}
