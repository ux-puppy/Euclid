import type { ReactNode } from 'react'
import { inspectorStack } from '../../components/editor/inspector/inspectorStyles'
import { cn } from '../../lib/utils'

/** Stacks inspector-style sliders/switches with visible surfaces on the case study page. */
export function DemoControls({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(inspectorStack, 'w-full min-w-0 text-foreground', className)}>
      {children}
    </div>
  )
}
