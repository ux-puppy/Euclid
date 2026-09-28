import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import { inspectorField } from './inspectorStyles'

type ColorsInspectorSectionProps = {
  title: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
}

export function ColorsInspectorSection({
  title,
  headerRight,
  children,
  className,
}: ColorsInspectorSectionProps) {
  return (
    <section
      className={cn(
        'flex w-full min-w-0 flex-col gap-2 border-b border-border px-3.5 pb-3.5 pt-3',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </h3>
        {headerRight}
      </div>
      <div className={cn('flex flex-col gap-1.5', inspectorField)}>{children}</div>
    </section>
  )
}
