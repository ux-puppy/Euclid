import { labelOnFill } from '../../accessibility/contrast'
import { cn } from '../../lib/utils'

type PaletteStripProps = {
  colors: string[]
  className?: string
  /** Tall vertical swatches (Figma demo style). */
  vertical?: boolean
  showSequence?: boolean
}

export function PaletteStrip({
  colors,
  className,
  vertical = true,
  showSequence = false,
}: PaletteStripProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 gap-0.5',
        vertical ? 'h-full min-h-[72px] items-stretch' : 'h-5 items-center',
        className,
      )}
    >
      {colors.map((fill, i) => (
        <div
          key={`${fill}-${i}`}
          className="relative min-w-0 flex-1 rounded-lg"
          style={{ backgroundColor: fill }}
          title={showSequence ? `Color ${i + 1}` : undefined}
        >
          {showSequence ? (
            <span
              className="absolute inset-0 flex items-center justify-center font-mono text-xs font-medium"
              style={{ color: labelOnFill(fill) }}
            >
              {i + 1}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
