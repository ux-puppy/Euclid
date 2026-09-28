import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '../../lib/utils'

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  section?: boolean
}

export function Label({ className, section = true, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        section
          ? 'text-[11px] font-medium tracking-[0.11px] text-muted-foreground uppercase px-1.5'
          : 'text-sm font-medium text-foreground/70',
        className,
      )}
      {...props}
    />
  )
}
