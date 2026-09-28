import { controlSurface, controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline' | 'control'
  size?: 'sm' | 'icon' | 'iconSm'
}

export function Button({
  className,
  variant = 'default',
  size = 'sm',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-sm font-medium disabled:opacity-50 disabled:pointer-events-none',
        controlSurfaceTransition,
        size === 'sm' && 'h-8 px-3',
        size === 'icon' && 'h-8 w-8',
        size === 'iconSm' && 'h-[30px] w-[30px] shrink-0 rounded-lg',
        variant === 'default' && 'bg-panel-elevated text-foreground hover:bg-accent',
        variant === 'ghost' && 'text-muted-foreground hover:bg-panel-elevated hover:text-foreground',
        variant === 'outline' && 'border border-border text-foreground/70 hover:bg-panel-elevated',
        variant === 'control' && cn('text-foreground/80', controlSurface),
        className,
      )}
      {...props}
    />
  )
}
