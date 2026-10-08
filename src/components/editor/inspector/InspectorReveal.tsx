import { cn } from '../../../lib/utils'

/** Smooth height + opacity reveal for conditional inspector blocks. */
export function InspectorReveal({
  show,
  children,
  className,
  innerClassName,
  pullUpWhenClosed = true,
}: {
  show: boolean
  children: React.ReactNode
  className?: string
  innerClassName?: string
  /** When false, keep collapsed height flush (nested cards like Accessibility Threshold). */
  pullUpWhenClosed?: boolean
}) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out motion-reduce:transition-none',
        show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none',
        !show && pullUpWhenClosed && '-mt-2',
        className,
      )}
      aria-hidden={!show}
    >
      <div className="overflow-hidden min-h-0">
        <div className={cn('flex w-full min-w-0 flex-col', innerClassName ?? 'gap-2')}>
          {children}
        </div>
      </div>
    </div>
  )
}
