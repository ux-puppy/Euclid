import { IroColorPicker } from '../../ui/iro-color-picker'

type ColorTokenRowProps = {
  label: string
  value: string
  onChange: (color: string) => void
  variant?: 'default' | 'pill'
}

export function ColorTokenRow({
  label,
  value,
  onChange,
  variant = 'default',
}: ColorTokenRowProps) {
  if (variant === 'pill') {
    return (
      <div className="flex w-full min-w-0 items-center justify-between gap-2 py-0.5">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/60">
          {label}
        </span>
        <IroColorPicker variant="pill" value={value} onChange={onChange} label={label} />
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2 py-0.5">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/60 capitalize">
        {label}
      </span>
      <IroColorPicker value={value} onChange={onChange} label={label} />
    </div>
  )
}
