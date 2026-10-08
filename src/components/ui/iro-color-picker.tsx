import iro from '@jaames/iro'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { controlSurface, controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'
import { colorForIro, colorToHexField, formatIroColor, parseHexInput } from '../../lib/colorFormat'

type IroColorPickerProps = {
  value: string
  onChange: (color: string) => void
  label: string
  className?: string
  variant?: 'default' | 'pill'
  /** Opens the picker panel on first mount (e.g. after click-to-edit). */
  defaultOpen?: boolean
  triggerClassName?: string
  onOpenChange?: (open: boolean) => void
}

const PICKER_WIDTH = 200
const PANEL_WIDTH = PICKER_WIDTH + 16
const VIEWPORT_PAD = 12
const ANCHOR_GAP = 4

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function IroColorPicker({
  value,
  onChange,
  label,
  className,
  variant = 'default',
  defaultOpen = false,
  triggerClassName,
  onOpenChange,
}: IroColorPickerProps) {
  const [open, setOpen] = useState(defaultOpen)

  const setOpenTracked = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setOpen((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        if (resolved !== prev) onOpenChange?.(resolved)
        return resolved
      })
    },
    [onOpenChange],
  )
  const [hexField, setHexField] = useState('')
  const [hexError, setHexError] = useState(false)
  const [previewColor, setPreviewColor] = useState(value)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null)
  const [panelReady, setPanelReady] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<ReturnType<typeof iro.ColorPicker> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const panelId = useId()

  const computePanelPosition = useCallback((): { top: number; left: number } | null => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return null

    const vw = window.innerWidth
    const vh = window.innerHeight
    const tr = trigger.getBoundingClientRect()
    const panelW = panel.offsetWidth || PANEL_WIDTH
    const panelH = panel.offsetHeight
    if (panelH <= 0) return null

    let left = tr.right - panelW
    let top = tr.bottom + ANCHOR_GAP

    const overflowBottom = top + panelH > vh - VIEWPORT_PAD
    const roomAbove = tr.top - ANCHOR_GAP - panelH >= VIEWPORT_PAD
    if (overflowBottom && roomAbove) {
      top = tr.top - panelH - ANCHOR_GAP
    }

    left = clamp(left, VIEWPORT_PAD, vw - panelW - VIEWPORT_PAD)
    top = clamp(top, VIEWPORT_PAD, vh - panelH - VIEWPORT_PAD)

    return { top, left }
  }, [])

  const updatePanelPosition = useCallback(() => {
    const pos = computePanelPosition()
    if (pos) setPanelPos(pos)
  }, [computePanelPosition])

  useLayoutEffect(() => {
    if (!open || !mountRef.current) {
      setPanelReady(false)
      setPanelPos(null)
      return
    }

    setPanelReady(false)
    const mount = mountRef.current
    const picker = iro.ColorPicker(mount, {
      width: PICKER_WIDTH,
      color: colorForIro(value),
      layout: [
        { component: iro.ui.Box, options: {} },
        { component: iro.ui.Slider, options: { sliderType: 'hue' } },
        { component: iro.ui.Slider, options: { sliderType: 'alpha' } },
      ],
    })
    pickerRef.current = picker
    setHexField(colorToHexField(picker.color))
    setPreviewColor(formatIroColor(picker.color))

    const onChangeLive = (color: iro.Color) => {
      setHexField(colorToHexField(color))
      setHexError(false)
      setPreviewColor(formatIroColor(color))
    }
    const onEnd = (color: iro.Color) => {
      const formatted = formatIroColor(color)
      setPreviewColor(formatted)
      onChangeRef.current(formatted)
    }

    picker.on('color:change', onChangeLive)
    picker.on('input:end', onEnd)

    const pos = computePanelPosition()
    if (pos) {
      setPanelPos(pos)
      setPanelReady(true)
    }

    const panel = panelRef.current
    const ro = panel ? new ResizeObserver(() => updatePanelPosition()) : null
    if (panel && ro) ro.observe(panel)
    window.addEventListener('scroll', updatePanelPosition, true)
    window.addEventListener('resize', updatePanelPosition)

    return () => {
      picker.off('color:change', onChangeLive)
      picker.off('input:end', onEnd)
      pickerRef.current = null
      mount.innerHTML = ''
      ro?.disconnect()
      window.removeEventListener('scroll', updatePanelPosition, true)
      window.removeEventListener('resize', updatePanelPosition)
      setPanelReady(false)
    }
  }, [open, value, computePanelPosition, updatePanelPosition])

  useEffect(() => {
    setPreviewColor(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpenTracked(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open, setOpenTracked])

  const applyHex = () => {
    const trimmed = hexField.trim()
    if (trimmed === '') {
      setHexError(false)
      if (pickerRef.current) setHexField(colorToHexField(pickerRef.current.color))
      else setHexField(value.toUpperCase())
      return
    }
    const parsed = parseHexInput(hexField)
    if (!parsed || !pickerRef.current) {
      setHexError(true)
      if (pickerRef.current) setHexField(colorToHexField(pickerRef.current.color))
      else setHexField(value.toUpperCase())
      return
    }
    setHexError(false)
    pickerRef.current.color.set(parsed)
    const formatted = formatIroColor(pickerRef.current.color)
    setHexField(colorToHexField(pickerRef.current.color))
    setPreviewColor(formatted)
    onChangeRef.current(formatted)
  }

  const panel =
    open &&
    createPortal(
      <div
        id={panelId}
        ref={panelRef}
        className="fixed z-[100] rounded-lg border border-border bg-popover p-2 shadow-lg"
        style={{
          width: PANEL_WIDTH,
          top: panelPos?.top ?? 0,
          left: panelPos?.left ?? 0,
          opacity: panelReady && panelPos ? 1 : 0,
          pointerEvents: panelReady && panelPos ? 'auto' : 'none',
        }}
        role="dialog"
        aria-label={`${label} color picker`}
      >
        <div ref={mountRef} className="iro-host [&_.IroColorPicker]:!bg-transparent" />
        <input
          type="text"
          value={hexField}
          onChange={(e) => setHexField(e.target.value.toUpperCase())}
          onBlur={applyHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyHex()
          }}
          spellCheck={false}
          className={cn(
            'mt-2 h-8 w-full rounded-lg border px-2 font-mono text-xs text-foreground euclid-no-spin',
            controlSurface,
            hexError ? 'border-red-500/60' : 'border-border',
          )}
          aria-label="Hex color"
        />
      </div>,
      document.body,
    )

  return (
    <>
      <div className={cn('relative inline-flex', className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`Pick color for ${label}`}
          onClick={() => setOpenTracked((o) => !o)}
          className={cn(
            'shrink-0 cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border',
            controlSurfaceTransition,
            variant === 'pill'
              ? 'h-[19px] w-[38px] rounded-full border border-white/20 hover:border-white/30'
              : 'h-7 w-7 rounded border border-border hover:border-foreground/30',
            triggerClassName,
          )}
          style={{ background: previewColor }}
        />
      </div>
      {panel}
    </>
  )
}
