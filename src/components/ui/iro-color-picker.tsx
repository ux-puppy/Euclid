import iro from '@jaames/iro'
import { useEffect, useId, useRef, useState } from 'react'
import { controlSurface, controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'
import { colorForIro, colorToHexField, formatIroColor, parseHexInput } from '../../lib/colorFormat'

type IroColorPickerProps = {
  value: string
  onChange: (color: string) => void
  label: string
  className?: string
  variant?: 'default' | 'pill'
}

const PICKER_WIDTH = 200

export function IroColorPicker({
  value,
  onChange,
  label,
  className,
  variant = 'default',
}: IroColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [hexField, setHexField] = useState('')
  const [hexError, setHexError] = useState(false)
  const [previewColor, setPreviewColor] = useState(value)
  const rootRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<ReturnType<typeof iro.ColorPicker> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const panelId = useId()

  useEffect(() => {
    setPreviewColor(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  useEffect(() => {
    if (!open || !mountRef.current) return

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

    return () => {
      picker.off('color:change', onChangeLive)
      picker.off('input:end', onEnd)
      pickerRef.current = null
      mount.innerHTML = ''
    }
  }, [open, value])

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

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Pick color for ${label}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'shrink-0 cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border',
          controlSurfaceTransition,
          variant === 'pill'
            ? 'h-[19px] w-[38px] rounded-full border border-white/20 hover:border-white/30'
            : 'h-7 w-7 rounded border border-border hover:border-foreground/30',
        )}
        style={{ background: previewColor }}
      />
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-2 shadow-lg"
          style={{ width: PICKER_WIDTH + 16 }}
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
        </div>
      )}
    </div>
  )
}
