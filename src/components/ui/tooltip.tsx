import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../../lib/utils'

export function TooltipProvider({
  delayDuration = 400,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={100} {...props} />
  )
}

export function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />
}

export function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger {...props} />
}

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-[100] max-w-[260px] rounded-lg border border-border bg-popover px-3 py-2',
          'text-xs font-normal leading-snug text-foreground shadow-lg',
          'transition-opacity duration-150 motion-reduce:transition-none',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

/** Inspector helper: Radix tooltip when `content` is set; otherwise passthrough. */
export function ControlTooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset,
  className,
}: {
  content?: string
  children: React.ReactElement
  side?: React.ComponentProps<typeof TooltipPrimitive.Content>['side']
  align?: React.ComponentProps<typeof TooltipPrimitive.Content>['align']
  sideOffset?: number
  className?: string
}) {
  if (!content?.trim()) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} sideOffset={sideOffset} className={className}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
