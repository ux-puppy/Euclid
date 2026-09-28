import { OverlayScrollArea } from './overlay-scroll-area'
import { cn } from '../../lib/utils'

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <OverlayScrollArea className={cn(className)} {...props}>
      {children}
    </OverlayScrollArea>
  )
}
