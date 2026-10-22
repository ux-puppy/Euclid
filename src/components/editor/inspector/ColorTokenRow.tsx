import { IroColorPicker } from '../../ui/iro-color-picker'
import { ControlTooltip } from '../../ui/tooltip'

type ColorTokenRowProps = {
  label: string
  tooltip?: string
  value: string
  onChange: (color: string) => void
  variant?: 'default' | 'pill'
}

export function ColorTokenRow({
  label,
  tooltip,
  value,
  onChange,
  variant = 'default',
}: ColorTokenRowProps) {
  const rowClass = 'flex h-[30px] w-full min-w-0 items-center justify-between gap-2'

  if (variant === 'pill') {
    return (
      <ControlTooltip content={tooltip} side="top" align="start">
        <div className={rowClass}>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/60">
            {label}
          </span>
          <IroColorPicker variant="pill" value={value} onChange={onChange} label={label} />
        </div>
      </ControlTooltip>
    )
  }

  return (
    <ControlTooltip content={tooltip} side="top" align="start">
      <div className={rowClass}>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/60 capitalize">
          {label}
        </span>
        <IroColorPicker value={value} onChange={onChange} label={label} />
      </div>
    </ControlTooltip>
  )
}
