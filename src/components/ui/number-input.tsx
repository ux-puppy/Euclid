import { useEffect, useState } from 'react'
import { controlSurface } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'

type NumberInputProps = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  className?: string
  ariaLabel?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function snapToStep(n: number, step: number, min: number) {
  if (step <= 0) return n
  const steps = Math.round((n - min) / step)
  return min + steps * step
}

export function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  ariaLabel,
}: NumberInputProps) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  const commit = () => {
    const trimmed = text.trim()
    if (trimmed === '') {
      setText(String(value))
      return
    }
    const n = Number(trimmed)
    if (Number.isNaN(n)) {
      setText(String(value))
      return
    }
    const snapped = snapToStep(n, step, min)
    const next = clamp(snapped, min, max)
    onChange(next)
    setText(String(next))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      aria-label={ariaLabel}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        commit()
      }}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      className={cn(
        'h-7 min-w-0 rounded border border-border px-1.5 font-mono text-xs text-foreground',
        controlSurface,
        'euclid-no-spin',
        className,
      )}
    />
  )
}
