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
import { inspectorStack, inspectorTabRoot } from './inspectorStyles'
import {
  isHeatmapChartSpec,
  type HeatmapChartSpec,
  type TabularPatternId,
} from '../../../chart-spec/types'
import {
  barSafeTabularPattern,
  unifiedParamsFromHeatmap,
  unifiedParamsFromSpecs,
} from '../../../data/unifiedData'

export function InspectorSettingsTab() {
  const spec = useEditorStore((s) => s.spec)
  const specsByVariant = useEditorStore((s) => s.specsByVariant)
  const isHeatmap = isHeatmapChartSpec(spec)
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
  const unifiedDataParams = isHeatmap
    ? unifiedParamsFromHeatmap(spec as HeatmapChartSpec)
    : unifiedParamsFromSpecs(specsByVariant)
  const categoryPattern = isHeatmap
    ? unifiedDataParams.pattern
    : barSafeTabularPattern(unifiedDataParams.pattern)
  const seriesPattern = isHeatmap
    ? unifiedDataParams.seriesPattern
    : barSafeTabularPattern(unifiedDataParams.seriesPattern)

  return (
    <div className={inspectorTabRoot}>
      <InspectorSection title="Sample Data">
        <PatternDataControl
          label="Category data shape"
          isTree={false}
          isCustom={isCustom}
          patternId={categoryPattern}
          includePositiveNegative={isHeatmap}
          onPatternChange={(p) => setPattern(p)}
          onRandomize={randomize}
        />
        <InspectorReveal show={!isCustom}>
          <SliderControl
            label="Categories"
            value={provParams.categoryCount ?? 6}
            min={2}
            max={MAX_PALETTE_BASE_COUNT}
            step={1}
            onChange={(v) => regenerateAllData({ categoryCount: v })}
          />
        </InspectorReveal>
        <PatternDataControl
          label="Series data shape"
          isTree={false}
          isCustom={isCustom}
          patternId={seriesPattern}
          includePositiveNegative={isHeatmap}
          showRandomize={false}
          onPatternChange={(p) =>
            regenerateAllData({ seriesPattern: p as TabularPatternId })
          }
          onRandomize={randomize}
        />
        <InspectorReveal show={!isCustom}>
          <SliderControl
            label="Series"
            value={provParams.seriesCount ?? 5}
            min={1}
            max={isHeatmap ? 16 : 8}
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

      <InspectorSection title="Project" defaultOpen={false}>
        <div className={inspectorStack}>
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
