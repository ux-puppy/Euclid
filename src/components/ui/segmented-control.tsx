import { useLayoutEffect, useRef, useState } from 'react'
import { controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'

export type SegmentOption<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  /** Stretch segments to fill the row (inspector fields). */
  fullWidth?: boolean
  /** Match 30px inspector control height. */
  compact?: boolean
  disabled?: boolean
}

/** Outer track radius; thumb uses 2px less (see `thumbRadiusClass`). */
function shellRadiusClass(fullWidth: boolean, compact: boolean) {
  return fullWidth && compact ? 'rounded-lg' : 'rounded-[23px]'
}

function thumbRadiusClass(fullWidth: boolean, compact: boolean) {
  return fullWidth && compact ? 'rounded-md' : 'rounded-[21px]'
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  fullWidth = false,
  compact = false,
  disabled = false,
}: SegmentedControlProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      if (!active) return
      const listRect = list.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      setIndicator({
        left: activeRect.left - listRect.left,
        width: activeRect.width,
        ready: true,
      })
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(list)
    return () => ro.disconnect()
  }, [value, options.length, fullWidth, compact])

  const shellRadius = shellRadiusClass(fullWidth, compact)
  const thumbRadius = thumbRadiusClass(fullWidth, compact)

  return (
    <div
      ref={listRef}
      className={cn(
        'relative items-center bg-segment p-0.5 text-sm',
        shellRadius,
        fullWidth ? 'flex w-full min-w-0' : 'inline-flex',
        compact && 'h-[30px]',
        controlSurfaceTransition,
        className,
      )}
      role="tablist"
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0.5 bottom-0.5 bg-segment-active',
          thumbRadius,
          'transition-[left,width,opacity] duration-200 ease-out motion-reduce:transition-none',
          indicator.ready ? 'opacity-100' : 'opacity-0',
        )}
        style={{ left: indicator.left, width: indicator.width }}
      />
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            title={opt.label}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-[1] font-medium',
              thumbRadius,
              fullWidth ? 'min-w-0 flex-1 truncate px-2' : 'px-2.5 py-1',
              compact && fullWidth && 'flex h-full items-center justify-center py-0',
              'transition-colors duration-200 ease-out motion-reduce:transition-none',
              disabled && 'cursor-not-allowed opacity-50',
              selected
                ? 'text-segment-active-fg'
                : 'text-foreground/80 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
