import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { cn } from '../../../lib/utils'
import { inspectorField, inspectorFieldLabel } from './inspectorStyles'

export type SelectOption = { value: string; label: string }

type InspectorSelectProps = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  appearance?: 'default' | 'colors'
}

export function InspectorSelect({
  value,
  options,
  onChange,
  label,
  placeholder,
  disabled,
  appearance = 'default',
}: InspectorSelectProps) {
  return (
    <div className={cn('space-y-1', inspectorField)}>
      {label ? <span className={cn('block', inspectorFieldLabel)}>{label}</span> : null}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger surface={appearance} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
