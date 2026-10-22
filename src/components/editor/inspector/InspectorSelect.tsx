import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { SegmentedControl } from '../../ui/segmented-control'
import { cn } from '../../../lib/utils'
import { colorsTabSurface } from '../../../lib/controlSurface'
import { ControlTooltip } from '../../ui/tooltip'
import { inspectorControlCaption, inspectorLabeledField } from './inspectorStyles'

export type SelectOption = { value: string; label: string; tooltip?: string }

type InspectorSelectProps = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  tooltip?: string
  placeholder?: string
  disabled?: boolean
  appearance?: 'default' | 'colors'
}

export function InspectorSelect({
  value,
  options,
  onChange,
  label,
  tooltip,
  placeholder,
  disabled,
  appearance = 'default',
}: InspectorSelectProps) {
  const useSegments = options.length < 3

  const field = (
    <div className={inspectorLabeledField}>
      {label ? <span className={cn('block', inspectorControlCaption)}>{label}</span> : null}
      {useSegments ? (
        <SegmentedControl
          options={options}
          value={value}
          onChange={onChange}
          fullWidth
          compact
          disabled={disabled}
          className={cn(appearance === 'colors' && colorsTabSurface)}
        />
      ) : (
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
      )}
    </div>
  )

  return (
    <ControlTooltip content={tooltip} side="top" align="start">
      {field}
    </ControlTooltip>
  )
}
