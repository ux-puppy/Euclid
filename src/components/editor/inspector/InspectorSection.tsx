import { CaretRight } from '@phosphor-icons/react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import { inspectorField } from './inspectorStyles'
import { InspectorReveal } from './InspectorReveal'

export type InspectorSectionProps = {
  title: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  /** Vertical gap between fields (Figma: 6px default, OKLCH block uses 12px). */
  contentClassName?: string
  defaultOpen?: boolean
  /** Non-interactive content (e.g. theme-inactive palette targets). */
  disabled?: boolean
}

/** Figma 185:203 / 185:238 — header band; title + headerRight left, caret right. */
export function InspectorSection({
  title,
  headerRight,
  children,
  className,
  contentClassName,
  defaultOpen = true,
  disabled = false,
}: InspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const onCollapsedKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const titleClass =
    'truncate text-[10px] font-bold uppercase tracking-[0.6px] text-muted-foreground'

  const caret = (
    <CaretRight
      size={14}
      weight="bold"
      className={cn(
        'shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none',
        open ? '-rotate-90' : 'rotate-90',
      )}
      aria-hidden
    />
  )

  return (
    <section
      className={cn(
        'flex w-full min-w-0 flex-col border-b border-border transition-colors duration-100',
        !open && 'cursor-pointer hover:bg-inspector-section-hover',
        className,
      )}
      onClick={!open ? () => setOpen(true) : undefined}
      onKeyDown={!open ? onCollapsedKeyDown : undefined}
      tabIndex={!open ? 0 : undefined}
      role={!open ? 'button' : undefined}
      aria-expanded={open}
    >
      <div className="flex w-full min-w-0 items-center justify-between px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {open ? (
            <button
              type="button"
              className="min-w-0 cursor-pointer text-left"
              onClick={() => setOpen(false)}
            >
              <h3 className={titleClass}>{title}</h3>
            </button>
          ) : (
            <h3 className={cn(titleClass, 'pointer-events-none')}>{title}</h3>
          )}
          {headerRight ? (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          ) : null}
        </div>
        {open ? (
          <button
            type="button"
            className="shrink-0 cursor-pointer"
            aria-label={`Collapse ${title}`}
            onClick={() => setOpen(false)}
          >
            {caret}
          </button>
        ) : (
          <div className="pointer-events-none shrink-0">{caret}</div>
        )}
      </div>
      <InspectorReveal
        show={open}
        pullUpWhenClosed={false}
        innerClassName={cn(
          'px-3.5 pb-3.5',
          contentClassName ?? 'gap-1.5',
          inspectorField,
          disabled && 'pointer-events-none opacity-40',
        )}
      >
        {children}
      </InspectorReveal>
    </section>
  )
}
