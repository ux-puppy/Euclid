import { CaretRight } from '@phosphor-icons/react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import {
  inspectorField,
  inspectorSectionBodyPadding,
  inspectorSectionHeaderGap,
  inspectorStackGap,
} from './inspectorStyles'
import { ControlTooltip } from '../../ui/tooltip'
import { InspectorReveal } from './InspectorReveal'

export type InspectorSectionProps = {
  title: string
  /** Native tooltip on the section title. */
  titleTooltip?: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  /** Override vertical gap between fields (default: `inspectorStackGap`). */
  contentClassName?: string
  defaultOpen?: boolean
  /** Non-interactive content (e.g. theme-inactive palette targets). */
  disabled?: boolean
}

/** Figma 185:203 / 185:238 — header band; title + headerRight left, caret right. */
export function InspectorSection({
  title,
  titleTooltip,
  headerRight,
  children,
  className,
  contentClassName,
  defaultOpen = true,
  disabled = false,
}: InspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const onToggleKeyDown = (expand: boolean) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(expand)
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
        open && inspectorSectionHeaderGap,
        !open && 'cursor-pointer hover:bg-inspector-section-hover',
        className,
      )}
      onClick={!open ? () => setOpen(true) : undefined}
      onKeyDown={!open ? onToggleKeyDown(true) : undefined}
      tabIndex={!open ? 0 : undefined}
      role={!open ? 'button' : undefined}
      aria-expanded={open}
    >
      <div
        className={cn(
          'flex w-full min-w-0 items-center justify-between px-3.5 pt-3',
          open ? 'cursor-pointer pb-1 hover:bg-inspector-section-hover' : 'pb-3',
        )}
        onClick={open ? () => setOpen(false) : undefined}
        onKeyDown={open ? onToggleKeyDown(false) : undefined}
        tabIndex={open ? 0 : undefined}
        role={open ? 'button' : undefined}
        aria-label={open ? `Collapse ${title}` : undefined}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ControlTooltip content={titleTooltip} side="top" align="start">
            <h3
              className={cn(titleClass, !open && 'pointer-events-none', titleTooltip && 'pointer-events-auto')}
            >
              {title}
            </h3>
          </ControlTooltip>
          {headerRight ? (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          ) : null}
        </div>
        <div className={cn('shrink-0', !open && 'pointer-events-none')}>{caret}</div>
      </div>
      <InspectorReveal
        show={open}
        animated
        innerClassName={cn(
          inspectorSectionBodyPadding,
          contentClassName ?? inspectorStackGap,
          inspectorField,
          disabled && 'pointer-events-none opacity-40',
        )}
      >
        {children}
      </InspectorReveal>
    </section>
  )
}
