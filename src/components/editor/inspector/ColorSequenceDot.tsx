import { labelOnFill } from '../../../accessibility/contrast'
import { cn } from '../../../lib/utils'

type ColorSequenceDotProps = {
  sequence: number
  hex: string
  className?: string
  title?: string
  style?: React.CSSProperties
  /** iro-style black + white ring (wheel handles). */
  variant?: 'default' | 'wheel'
}

export function ColorSequenceDot({
  sequence,
  hex,
  className,
  title,
  style,
  variant = 'default',
}: ColorSequenceDotProps) {
  const labelColor = labelOnFill(hex)

  const wheelNumberShadow =
    variant === 'wheel'
      ? labelColor === '#fff'
        ? '0 1px 2px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.35)'
        : '0 1px 1px rgba(255,255,255,0.85), 0 0 2px rgba(255,255,255,0.5)'
      : undefined

  return (
    <div
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full',
        variant === 'wheel'
          ? 'border-2 border-black/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
          : 'border border-foreground/80',
        className,
      )}
      style={{ background: hex, ...style }}
      title={title ?? `Color ${sequence}`}
    >
      <span
        className="font-mono text-[10px] font-medium leading-none tracking-[0.02em]"
        style={{ color: labelColor, textShadow: wheelNumberShadow }}
      >
        {sequence}
      </span>
    </div>
  )
}
