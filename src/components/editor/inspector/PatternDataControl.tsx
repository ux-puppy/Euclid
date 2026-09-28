import { ShuffleSimple } from '@phosphor-icons/react'
import { Button } from '../../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { controlSurface } from '../../../lib/controlSurface'
import { tabularPatternOptions, treePatternOptions } from './patternLabels'
import { cn } from '../../../lib/utils'
import type { TabularPatternId, TreePatternId } from '../../../chart-spec/types'

type PatternDataControlProps = {
  isTree: boolean
  isCustom: boolean
  patternId: string | undefined
  onPatternChange: (pattern: TabularPatternId | TreePatternId) => void
  onRandomize: () => void
}

export function PatternDataControl({
  isTree,
  isCustom,
  patternId,
  onPatternChange,
  onRandomize,
}: PatternDataControlProps) {
  const options = isTree ? treePatternOptions() : tabularPatternOptions()

  return (
    <div className="w-full min-w-0 space-y-1">
      <div className="flex w-full min-w-0 gap-2">
        <div className="flex-1 min-w-0">
          {isCustom ? (
            <div
              className={cn(
                'flex h-[30px] items-center rounded-lg px-2 text-sm font-medium text-muted-foreground',
                controlSurface,
              )}
            >
              Custom
            </div>
          ) : (
            <Select
              value={patternId}
              onValueChange={(v) => onPatternChange(v as TabularPatternId & TreePatternId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pattern" />
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
        <Button
          size="iconSm"
          variant="control"
          onClick={onRandomize}
          disabled={isCustom}
          title="Randomize"
          aria-label="Randomize data"
        >
          <ShuffleSimple size={14} />
        </Button>
      </div>
    </div>
  )
}
