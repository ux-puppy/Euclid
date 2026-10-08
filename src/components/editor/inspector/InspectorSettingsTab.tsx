import { MAX_PALETTE_BASE_COUNT } from '../../../visualization-colors/constants'
import { SliderControl } from '../../ui/slider-control'
import { Button } from '../../ui/button'
import { useEditorStore } from '../../../store/editorStore'
import { copyJSON, downloadJSON } from '../../../chart-spec/exportImport'
import { InspectorSection } from './InspectorSection'
import { PatternDataControl } from './PatternDataControl'
import { DEFAULT_TREE_MAX_DEPTH } from '../../../chart-spec/defaults'
import { InspectorCommonSettings } from './InspectorCommonSettings'
import { InspectorReveal } from './InspectorReveal'
export function InspectorSettingsTab() {
  const spec = useEditorStore((s) => s.spec)
  const setSpec = useEditorStore((s) => s.setSpec)
  const setPattern = useEditorStore((s) => s.setPattern)
  const randomize = useEditorStore((s) => s.randomize)
  const regenerateAllData = useEditorStore((s) => s.regenerateAllData)
  const exportBundle = useEditorStore((s) => s.exportBundle)
  const importSpec = useEditorStore((s) => s.importSpec)
  const resetToDefault = useEditorStore((s) => s.resetToDefault)

  const isCustom = spec.data.provenance === null
  const isTree = spec.data.shape === 'tree'
  const provParams = spec.data.provenance?.params ?? {}

  return (
    <div className="pb-2">
      <InspectorSection title="Data">
        <p className="text-[10px] text-muted-foreground pb-1 leading-snug w-full min-w-0">
          Pattern, seed, and counts stay in sync across all three previews.
        </p>
        <PatternDataControl
          isTree={false}
          isCustom={isCustom}
          patternId={spec.data.provenance?.pattern}
          onPatternChange={(p) => setPattern(p)}
          onRandomize={randomize}
        />
        <InspectorReveal show={!isCustom}>
          <SliderControl
            label="Countries (categories)"
            value={provParams.categoryCount ?? 6}
            min={2}
            max={MAX_PALETTE_BASE_COUNT}
            step={1}
            onChange={(v) => regenerateAllData({ categoryCount: v })}
          />
          <SliderControl
            label="States (series)"
            value={provParams.seriesCount ?? 5}
            min={1}
            max={8}
            step={1}
            onChange={(v) => regenerateAllData({ seriesCount: v })}
          />
          <InspectorReveal show={isTree}>
            <SliderControl
              label="Tree depth (levels)"
              value={provParams.maxDepth ?? DEFAULT_TREE_MAX_DEPTH}
              min={1}
              max={4}
              step={1}
              onChange={(v) => regenerateAllData({ maxDepth: v })}
            />
            <SliderControl
              label="Default expanded depth"
              value={spec.data.shape === 'tree' ? spec.data.defaultExpandedDepth : 0}
              min={0}
              max={5}
              step={1}
              onChange={(v) =>
                setSpec((s) => {
                  if (s.data.shape === 'tree') s.data.defaultExpandedDepth = v
                })
              }
            />
          </InspectorReveal>
        </InspectorReveal>
      </InspectorSection>

      <InspectorCommonSettings activeSpec={spec} />

      <InspectorSection title="Project">
        <div className="flex w-full min-w-0 flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => downloadJSON(exportBundle(), 'euclid-charts.json')}
          >
            Download JSON
          </Button>
          <Button variant="outline" onClick={() => copyJSON(exportBundle())}>
            Copy JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'application/json'
              input.onchange = async () => {
                const file = input.files?.[0]
                if (!file) return
                importSpec(await file.text())
              }
              input.click()
            }}
          >
            Import JSON
          </Button>
          <Button variant="ghost" onClick={resetToDefault}>
            Reset default
          </Button>
        </div>
      </InspectorSection>
    </div>
  )
}
