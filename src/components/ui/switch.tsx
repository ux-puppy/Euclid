import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

/** Figma switch: 26×18 track, 14px thumb (node 168:371); colors via --euclid-switch-* tokens. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-[18px] w-[26px] shrink-0 cursor-pointer items-center rounded-full border border-switch-border p-[2px]',
        'transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=unchecked]:bg-switch-off data-[state=checked]:bg-switch-on',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-[14px] rounded-full bg-switch-thumb',
          'transition-transform duration-100',
          'data-[state=checked]:translate-x-[8px] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  )
}
