import { cn } from '../../../lib/utils'

/** Smooth height + opacity reveal for conditional inspector blocks. */
export function InspectorReveal({
  show,
  children,
  className,
}: {
  show: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out motion-reduce:transition-none',
        show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 -mt-2 pointer-events-none',
        className,
      )}
      aria-hidden={!show}
    >
      <div className="overflow-hidden min-h-0">
        <div className="flex w-full min-w-0 flex-col gap-2">{children}</div>
      </div>
    </div>
  )
}
