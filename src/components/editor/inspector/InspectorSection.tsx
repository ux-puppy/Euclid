import { Label } from '../../ui/label'
import { Separator } from '../../ui/separator'
import { inspectorField } from './inspectorStyles'

export function InspectorSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-3 py-2.5 space-y-2">
      <Label className="px-0">{title}</Label>
      <div className={`flex flex-col gap-2 ${inspectorField}`}>{children}</div>
      <Separator className="mt-2" />
    </div>
  )
}
