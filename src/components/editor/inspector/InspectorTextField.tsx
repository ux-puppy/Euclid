import { controlSurface } from '../../../lib/controlSurface'
import { cn } from '../../../lib/utils'
import { inspectorControlCaption, inspectorLabeledField } from './inspectorStyles'

type InspectorTextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function InspectorTextField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: InspectorTextFieldProps) {
  return (
    <div className={cn(inspectorLabeledField, className)}>
      <label className={cn('block', inspectorControlCaption)}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-[30px] w-full rounded-lg border border-border px-2 text-sm font-medium text-foreground/80 outline-none focus-visible:ring-1 focus-visible:ring-border',
          controlSurface,
        )}
      />
    </div>
  )
}
