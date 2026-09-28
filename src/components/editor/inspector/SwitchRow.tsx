import { Switch } from '../../ui/switch'
import { controlSurface } from '../../../lib/controlSurface'
import { cn } from '../../../lib/utils'
import { inspectorField, inspectorFieldLabel } from './inspectorStyles'

type SwitchRowProps = {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function SwitchRow({ label, checked, onCheckedChange }: SwitchRowProps) {
  return (
    <div
      className={cn(
        'flex h-[30px] items-center justify-between gap-3 rounded-lg px-2',
        controlSurface,
        inspectorField,
      )}
    >
      <span className={cn(inspectorFieldLabel, 'min-w-0 flex-1 truncate font-normal')}>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
