import { cn } from '../../../lib/utils'
import { inspectorStackGap, inspectorStackLayout } from './inspectorStyles'

/** Smooth height + opacity reveal for conditional inspector blocks. */
export function InspectorReveal({
  show,
  children,
  className,
  innerClassName,
  animated = false,
}: {
  show: boolean
  children: React.ReactNode
  className?: string
  innerClassName?: string
  /** Animate open/close (section bodies). Default: remove from layout when hidden. */
  animated?: boolean
  /** @deprecated Use `animated`. Kept for existing call sites. */
  pullUpWhenClosed?: boolean
}) {
  const inner = (
    <div className={cn(inspectorStackLayout, innerClassName ?? inspectorStackGap)}>{children}</div>
  )

  if (!animated) {
    return (
      <div className={cn(!show && 'hidden', className)} aria-hidden={!show}>
        {inner}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
        show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none',
        className,
      )}
      aria-hidden={!show}
    >
      <div className="overflow-hidden min-h-0">{inner}</div>
    </div>
  )
}
