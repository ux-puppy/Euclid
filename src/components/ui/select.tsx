import * as SelectPrimitive from '@radix-ui/react-select'
import { CaretDown, Check } from '@phosphor-icons/react'
import { colorsTabSurface, controlSurface, controlSurfaceTransition } from '../../lib/controlSurface'
import { cn } from '../../lib/utils'

export function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />
}

export function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />
}

export function SelectTrigger({
  className,
  children,
  hideIcon,
  surface = 'default',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  hideIcon?: boolean
  surface?: 'default' | 'colors'
}) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-[30px] w-full items-center justify-between gap-2 rounded-lg px-2 text-sm font-medium text-foreground/80',
        surface === 'colors' ? colorsTabSurface : controlSurface,
        'outline-none focus-visible:ring-1 focus-visible:ring-border',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {hideIcon ? null : (
        <SelectPrimitive.Icon asChild>
          <CaretDown size={14} className="shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  fitContent = true,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & { fitContent?: boolean }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'z-50 rounded-lg border border-border bg-popover p-1 shadow-lg',
          'w-[var(--radix-select-trigger-width)]',
          'overflow-x-hidden',
          fitContent ? 'overflow-y-visible' : 'max-h-60 overflow-y-auto',
          className,
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="w-full max-w-full p-0">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-7 pr-2 text-sm',
        'text-foreground/80 outline-none min-w-0 max-w-full',
        controlSurfaceTransition,
        'focus:bg-panel-elevated data-[highlighted]:bg-panel-elevated',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={12} weight="bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
