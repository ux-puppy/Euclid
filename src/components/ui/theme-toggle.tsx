import { Moon, Sun } from '@phosphor-icons/react'
import { controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'

type ThemeToggleProps = {
  theme: 'dark' | 'light'
  onToggle: (theme: 'dark' | 'light') => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <div className="flex rounded-2xl bg-segment p-0.5">
      <button
        type="button"
        aria-label="Light theme"
        onClick={() => onToggle('light')}
        className={cn(
          'p-1.5 rounded-2xl',
          controlSurfaceTransition,
          theme === 'light' ? 'bg-segment-active' : 'hover:bg-panel-elevated',
        )}
      >
        <Sun size={14} className="text-foreground/80" />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        onClick={() => onToggle('dark')}
        className={cn(
          'p-1.5 rounded-2xl',
          controlSurfaceTransition,
          theme === 'dark' ? 'bg-segment-active' : 'hover:bg-panel-elevated',
        )}
      >
        <Moon size={14} className="text-foreground/80" />
      </button>
    </div>
  )
}
