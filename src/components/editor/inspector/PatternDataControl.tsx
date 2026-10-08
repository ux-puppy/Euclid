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
import {
  inspectorControlCaption,
  inspectorInlineGap,
  inspectorLabeledField,
} from './inspectorStyles'
import type { TabularPatternId, TreePatternId } from '../../../chart-spec/types'

type PatternDataControlProps = {
  label?: string
  isTree: boolean
  isCustom: boolean
  patternId: string | undefined
  onPatternChange: (pattern: TabularPatternId | TreePatternId) => void
  onRandomize: () => void
  showRandomize?: boolean
  /** Positive + negative is heatmap-only for now. */
  includePositiveNegative?: boolean
}

export function PatternDataControl({
  label,
  isTree,
  isCustom,
  patternId,
  onPatternChange,
  onRandomize,
  showRandomize = true,
  includePositiveNegative = false,
}: PatternDataControlProps) {
  const options = isTree
    ? treePatternOptions()
    : tabularPatternOptions({ includePositiveNegative })

  return (
    <div className={inspectorLabeledField}>
      {label ? (
        <span className={cn('block', inspectorControlCaption)}>{label}</span>
      ) : null}
      <div className={cn('flex w-full min-w-0', inspectorInlineGap)}>
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
      {showRandomize ? (
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
      ) : null}
      </div>
    </div>
  )
}
