import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type DemoCardProps = {
  children: ReactNode
  className?: string
}

export function DemoCard({ children, className }: DemoCardProps) {
  return (
    <div
      className={cn(
        'w-full overflow-visible rounded-[14px] border border-white/10 bg-panel p-2 text-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}
