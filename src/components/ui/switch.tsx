import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

/** Figma 168:371 — 26×18 track, 2px inset, 14px thumb; off = start, on = end. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer box-border inline-flex h-[18px] w-[26px] shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-switch-border p-[2px]',
        'transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=unchecked]:justify-start data-[state=checked]:justify-end',
        'data-[state=unchecked]:bg-switch-off data-[state=checked]:bg-switch-on',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-[14px] shrink-0 rounded-full bg-switch-thumb',
          'transition-[transform] duration-100 ease-out motion-reduce:transition-none',
        )}
      />
    </SwitchPrimitive.Root>
  )
}
