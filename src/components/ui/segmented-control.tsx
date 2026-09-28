import { controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'

export type SegmentOption<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[23px] bg-segment p-0.5 text-sm',
        controlSurfaceTransition,
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-1 rounded-full font-medium',
            controlSurfaceTransition,
            value === opt.value
              ? 'bg-segment-active text-segment-active-fg'
              : 'text-foreground/80 hover:bg-panel-elevated hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
