import { SliderControl } from '../../ui/slider-control'
import { useEditorStore } from '../../../store/editorStore'
import { InspectorSection } from './InspectorSection'
import { InspectorReveal } from './InspectorReveal'
import { InspectorSelect } from './InspectorSelect'
import { SwitchRow } from './SwitchRow'
import { BezierEasingControl } from './BezierEasingControl'
import { InspectorTextField } from './InspectorTextField'
import { EASING_BEZIER } from '../../../chart-spec/easingPresets'
import { applyUniformChartPadding } from '../../../chart-spec/padding'
import type { ChartSpec, EasingPreset } from '../../../chart-spec/types'
import { isHeatmapChartSpec } from '../../../chart-spec/types'

function parseDashInput(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n >= 0)
}

function dashToInput(dash: number[]): string {
  return dash.length ? dash.join(', ') : ''
}

type InspectorCommonSettingsProps = {
  activeSpec: ChartSpec
}

export function InspectorCommonSettings({ activeSpec }: InspectorCommonSettingsProps) {
  const spec = useEditorStore((s) => s.spec)
  const setSpec = useEditorStore((s) => s.setSpec)
  const setSharedSpec = useEditorStore((s) => s.setSharedSpec)

  const isHeatmap = isHeatmapChartSpec(activeSpec)
  const heatmapLayout = isHeatmap ? activeSpec.layout : null
  const cartLayout =
    !isHeatmap && activeSpec.layout.mode === 'cartesian' ? activeSpec.layout : null
  const listLayout = !isHeatmap && activeSpec.layout.mode === 'list' ? activeSpec.layout : null
  const tabularSeries =
    activeSpec.data.shape === 'tabular' ? activeSpec.data.series.length : 0
  const showClassicBarGap =
    cartLayout != null &&
    cartLayout.barLayout === 'grouped' &&
    tabularSeries > 1 &&
    activeSpec.variant === 'classic'
  const showStackGap =
    cartLayout != null && cartLayout.barLayout === 'stacked' && tabularSeries > 1

  return (
    <>
      <InspectorSection title={isHeatmap ? 'Heatmap layout' : 'Layout & spacing'}>
        <SliderControl
          label="Padding"
          value={spec.chartPadding}
          min={0}
          max={64}
          step={1}
          onChange={(v) =>
            setSharedSpec((s) => {
              applyUniformChartPadding(s, v)
            })
          }
        />
        <SliderControl
          label="Container corner radius"
          value={spec.containerCornerRadius}
          min={0}
          max={32}
          step={1}
          onChange={(v) => setSharedSpec((s) => { s.containerCornerRadius = v })}
        />

        <InspectorReveal show={heatmapLayout != null}>
          <SwitchRow
            label="Auto height"
            checked={heatmapLayout?.height === 'auto'}
            onCheckedChange={(checked) =>
              setSpec((s) => {
                if (!isHeatmapChartSpec(s)) return
                s.layout.height = checked ? 'auto' : 400
              })
            }
          />
          <InspectorReveal show={heatmapLayout != null && heatmapLayout.height !== 'auto'}>
            <SliderControl
              label="Fixed height"
              value={typeof heatmapLayout?.height === 'number' ? heatmapLayout.height : 400}
              min={200}
              max={900}
              step={10}
              onChange={(v) =>
                setSpec((s) => {
                  if (isHeatmapChartSpec(s)) s.layout.height = v
                })
              }
            />
          </InspectorReveal>
          <SliderControl
            label="Cell corner radius"
            value={spec.geometry.cornerRadius}
            min={0}
            max={64}
            onChange={(v) => setSharedSpec((s) => { s.geometry.cornerRadius = v })}
          />
          <SwitchRow
            label="Lock width and height"
            checked={heatmapLayout?.lockCellSize ?? true}
            onCheckedChange={(checked) =>
              setSpec((s) => {
                if (!isHeatmapChartSpec(s)) return
                s.layout.lockCellSize = checked
                if (checked) {
                  const n = Math.max(s.layout.cellWidth, s.layout.cellHeight)
                  s.layout.cellWidth = n
                  s.layout.cellHeight = n
                }
              })
            }
          />
          <SliderControl
            label={heatmapLayout?.lockCellSize ? 'Cell size' : 'Cell width'}
            value={heatmapLayout?.cellWidth ?? 40}
            min={12}
            max={120}
            step={1}
            onChange={(v) =>
              setSpec((s) => {
                if (!isHeatmapChartSpec(s)) return
                s.layout.cellWidth = v
                if (s.layout.lockCellSize) s.layout.cellHeight = v
              })
            }
          />
          <InspectorReveal show={heatmapLayout != null && !heatmapLayout.lockCellSize}>
            <SliderControl
              label="Cell height"
              value={heatmapLayout?.cellHeight ?? 40}
              min={12}
              max={120}
              step={1}
              onChange={(v) =>
                setSpec((s) => {
                  if (!isHeatmapChartSpec(s)) return
                  s.layout.cellHeight = v
                })
              }
            />
          </InspectorReveal>
          <SliderControl
            label="Gap"
            value={heatmapLayout?.gap ?? 4}
            min={0}
            max={32}
            step={1}
            onChange={(v) =>
              setSpec((s) => {
                if (!isHeatmapChartSpec(s)) return
                s.layout.gap = v
              })
            }
          />
          <SliderControl
            label="Cell opacity"
            value={spec.geometry.opacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setSharedSpec((s) => { s.geometry.opacity = v })}
          />
          <SliderControl
            label="Cell border width"
            value={spec.geometry.borderWidth}
            min={0}
            max={4}
            step={0.5}
            onChange={(v) => setSharedSpec((s) => { s.geometry.borderWidth = v })}
          />
        </InspectorReveal>

        <InspectorReveal show={cartLayout != null}>
          <SwitchRow
            label="Auto height"
            checked={cartLayout?.height === 'auto'}
            onCheckedChange={(checked) =>
              setSpec((s) => {
                if (s.layout.mode !== 'cartesian') return
                s.layout.height = checked ? 'auto' : 400
              })
            }
          />
          <InspectorReveal show={cartLayout != null && cartLayout.height !== 'auto'}>
            <SliderControl
              label="Fixed height"
              value={typeof cartLayout?.height === 'number' ? cartLayout.height : 400}
              min={200}
              max={800}
              step={10}
              onChange={(v) =>
                setSpec((s) => {
                  if (s.layout.mode === 'cartesian') s.layout.height = v
                })
              }
            />
          </InspectorReveal>
          <InspectorSelect
            value={cartLayout?.barLayout ?? 'grouped'}
            options={[
              { value: 'grouped', label: 'Grouped' },
              { value: 'stacked', label: 'Stacked' },
            ]}
            onChange={(v) =>
              setSpec((s) => {
                if (s.layout.mode === 'cartesian')
                  s.layout.barLayout = v as 'grouped' | 'stacked'
              })
            }
          />
          <SliderControl
            label="Corner radius"
            value={spec.geometry.cornerRadius}
            min={0}
            max={64}
            onChange={(v) => setSharedSpec((s) => { s.geometry.cornerRadius = v })}
          />
          <SliderControl
            label="Bar thickness"
            value={spec.geometry.barThickness}
            min={4}
            max={64}
            onChange={(v) => setSharedSpec((s) => { s.geometry.barThickness = v })}
          />
          <InspectorReveal show={showClassicBarGap}>
            <SliderControl
              label="Bar gap (grouped series)"
              value={spec.geometry.barGap}
              min={0}
              max={32}
              step={1}
              onChange={(v) => setSharedSpec((s) => { s.geometry.barGap = v })}
            />
          </InspectorReveal>
          <InspectorReveal show={showStackGap}>
            <SliderControl
              label="Stack gap"
              value={spec.geometry.stackGap ?? 0}
              min={0}
              max={32}
              step={1}
              onChange={(v) => setSharedSpec((s) => { s.geometry.stackGap = v })}
            />
          </InspectorReveal>
          <SliderControl
            label="Group gap (categories)"
            value={spec.geometry.groupGap}
            min={0}
            max={48}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.geometry.groupGap = v })}
          />
          <SliderControl
            label="Bar opacity"
            value={spec.geometry.opacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setSharedSpec((s) => { s.geometry.opacity = v })}
          />
          <SliderControl
            label="Bar border width"
            value={spec.geometry.borderWidth}
            min={0}
            max={4}
            step={0.5}
            onChange={(v) => setSharedSpec((s) => { s.geometry.borderWidth = v })}
          />
        </InspectorReveal>

        <InspectorReveal show={listLayout != null}>
          {listLayout != null && (
            <>
              <InspectorSelect
                label="Value scale"
                value={listLayout.valueScale}
                options={[
                  { value: 'global', label: 'Global' },
                  { value: 'group', label: 'Per group' },
                  { value: 'parent', label: 'Per parent' },
                ]}
                onChange={(v) =>
                  setSpec((s) => {
                    if (s.layout.mode === 'list')
                      s.layout.valueScale = v as 'global' | 'group' | 'parent'
                  })
                }
              />
              <SwitchRow
                label="Auto height"
                checked={listLayout.height === 'auto'}
                onCheckedChange={(checked) =>
                  setSpec((s) => {
                    if (s.layout.mode !== 'list') return
                    s.layout.height = checked ? 'auto' : 400
                  })
                }
              />
              <InspectorReveal show={listLayout.height !== 'auto'}>
                <SliderControl
                  label="Fixed height"
                  value={listLayout.height === 'auto' ? 400 : listLayout.height}
                  min={200}
                  max={1200}
                  step={10}
                  onChange={(v) =>
                    setSpec((s) => {
                      if (s.layout.mode === 'list') s.layout.height = v
                    })
                  }
                />
              </InspectorReveal>
              <SliderControl
                label="Row gap"
                value={listLayout.rowGap}
                min={0}
                max={32}
                step={1}
                onChange={(v) =>
                  setSpec((s) => {
                    if (s.layout.mode === 'list') s.layout.rowGap = v
                  })
                }
              />
              <SliderControl
                label="Group gap"
                value={listLayout.groupGap}
                min={0}
                max={48}
                step={1}
                onChange={(v) =>
                  setSpec((s) => {
                    if (s.layout.mode === 'list') s.layout.groupGap = v
                  })
                }
              />
              <SliderControl
                label="Indent per level"
                value={listLayout.indentPerLevel}
                min={0}
                max={48}
                step={1}
                onChange={(v) =>
                  setSpec((s) => {
                    if (s.layout.mode === 'list') s.layout.indentPerLevel = v
                  })
                }
              />
              <SwitchRow
                label="Group titles"
                checked={listLayout.groupTitle.show}
                onCheckedChange={(checked) =>
                  setSpec((s) => {
                    if (s.layout.mode === 'list') s.layout.groupTitle.show = checked
                  })
                }
              />
              <InspectorReveal show={listLayout.groupTitle.show}>
                <SliderControl
                  label="Group title size"
                  value={listLayout.groupTitle.fontSize}
                  min={10}
                  max={24}
                  step={1}
                  onChange={(v) =>
                    setSpec((s) => {
                      if (s.layout.mode === 'list') s.layout.groupTitle.fontSize = v
                    })
                  }
                />
              </InspectorReveal>
              <SwitchRow
                label="Expand / collapse all (preview)"
                checked={listLayout.showExpandAllControl}
                onCheckedChange={(checked) =>
                  setSpec((s) => {
                    if (s.layout.mode === 'list') s.layout.showExpandAllControl = checked
                  })
                }
              />
            </>
          )}
        </InspectorReveal>
      </InspectorSection>

      <InspectorSection
        title={isHeatmap ? 'Typography & cell values' : 'Type & labels'}
        defaultOpen={false}
      >
        <InspectorTextField
          label="Font family"
          value={spec.typography.fontFamily}
          onChange={(v) => setSharedSpec((s) => { s.typography.fontFamily = v })}
          placeholder="DM Sans"
        />
        <SliderControl
          label="Base font size"
          value={spec.typography.baseFontSize}
          min={8}
          max={24}
          step={1}
          onChange={(v) => setSharedSpec((s) => { s.typography.baseFontSize = v })}
        />
        <InspectorTextField
          label={isHeatmap ? 'Cell value font' : 'Value font (%, numbers)'}
          value={spec.labels.valueFontFamily}
          onChange={(v) => setSharedSpec((s) => { s.labels.valueFontFamily = v })}
          placeholder="DM Mono"
        />
        <InspectorSelect
          label={isHeatmap ? 'Cell value format' : 'Value format'}
          value={spec.labels.valueFormat.style}
          options={[
            { value: 'percent', label: 'Percent' },
            { value: 'number', label: 'Number' },
          ]}
          onChange={(v) =>
            setSharedSpec((s) => {
              s.labels.valueFormat.style = v as 'percent' | 'number'
            })
          }
        />
        <SliderControl
          label="Decimal places (max 2)"
          value={spec.labels.valueFormat.decimals}
          min={0}
          max={2}
          step={1}
          onChange={(v) => setSharedSpec((s) => { s.labels.valueFormat.decimals = v })}
        />
        <InspectorTextField
          label="Value prefix"
          value={spec.labels.valueFormat.prefix}
          onChange={(v) => setSharedSpec((s) => { s.labels.valueFormat.prefix = v })}
        />
        <InspectorTextField
          label="Value suffix"
          value={spec.labels.valueFormat.suffix}
          onChange={(v) => setSharedSpec((s) => { s.labels.valueFormat.suffix = v })}
        />
        <SwitchRow
          label={isHeatmap ? 'Show values in cells' : 'Show labels'}
          checked={spec.labels.show}
          onCheckedChange={(checked) => setSharedSpec((s) => { s.labels.show = checked })}
        />
        <InspectorTextField
          label={isHeatmap ? 'Cell template ({value}, {label})' : 'Template ({value}, {label})'}
          value={spec.labels.template}
          onChange={(v) => setSharedSpec((s) => { s.labels.template = v })}
        />
        <SliderControl
          label="Vertical label offset"
          value={spec.labels.insetY ?? 0}
          min={-32}
          max={32}
          step={1}
          formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}px`}
          onChange={(v) => setSharedSpec((s) => { s.labels.insetY = v })}
        />
        <InspectorReveal show={!isHeatmap}>
          <SliderControl
            label="Inset from bar start"
            value={spec.labels.insetX}
            min={0}
            max={32}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.labels.insetX = v })}
          />
          <SliderControl
            label="Value column width"
            value={spec.labels.valueColumnWidth}
            min={24}
            max={120}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.labels.valueColumnWidth = v })}
          />
          <SliderControl
            label="Gap: value → name"
            value={spec.labels.valueLabelGap}
            min={0}
            max={32}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.labels.valueLabelGap = v })}
          />
          <InspectorSelect
            label="Position (reserved)"
            value={spec.labels.position}
            options={[
              { value: 'inside', label: 'Inside' },
              { value: 'outside', label: 'Outside' },
              { value: 'auto', label: 'Auto' },
            ]}
            onChange={(v) =>
              setSharedSpec((s) => {
                s.labels.position = v as 'inside' | 'outside' | 'auto'
              })
            }
          />
          <InspectorSelect
            label="Overflow"
            value={spec.labels.labelOverflow}
            options={[
              { value: 'fade', label: 'Fade' },
              { value: 'overflow', label: 'Overflow' },
              { value: 'outside', label: 'Outside' },
            ]}
            onChange={(v) =>
              setSharedSpec((s) => {
                s.labels.labelOverflow = v as 'fade' | 'overflow' | 'outside'
              })
            }
          />
        </InspectorReveal>
        <InspectorReveal show={isHeatmap}>
          <SliderControl
            label="Column label size"
            value={spec.axes.x.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.axes.x.fontSize = v })}
          />
          <SliderControl
            label="Row label size"
            value={spec.axes.y.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.axes.y.fontSize = v })}
          />
          <SliderControl
            label="Color scale label size"
            value={spec.legend.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.legend.fontSize = v })}
          />
        </InspectorReveal>
        <InspectorReveal show={!isHeatmap}>
          <SliderControl
            label="X tick font size"
            value={spec.axes.x.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.axes.x.fontSize = v })}
          />
          <SliderControl
            label="Y tick font size"
            value={spec.axes.y.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.axes.y.fontSize = v })}
          />
          <SliderControl
            label="Legend font size"
            value={spec.legend.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(v) => setSharedSpec((s) => { s.legend.fontSize = v })}
          />
        </InspectorReveal>
      </InspectorSection>

      <InspectorSection
        title={isHeatmap ? 'Labels & scale' : 'Axes & overlays'}
        defaultOpen={false}
      >
        <InspectorReveal show={isHeatmap}>
          <SwitchRow
            label="Column labels (bottom)"
            checked={spec.axes.x.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.axes.x.show = checked })}
          />
          <SwitchRow
            label="Row labels (left)"
            checked={spec.axes.y.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.axes.y.show = checked })}
          />
          <InspectorReveal show={spec.axes.x.show}>
            <SliderControl
              label="Column label X"
              value={heatmapLayout?.columnLabelOffsetX ?? 0}
              min={-80}
              max={80}
              step={1}
              onChange={(v) =>
                setSpec((s) => {
                  if (isHeatmapChartSpec(s)) s.layout.columnLabelOffsetX = v
                })
              }
            />
            <SliderControl
              label="Column label Y"
              value={heatmapLayout?.columnLabelOffsetY ?? 0}
              min={-40}
              max={80}
              step={1}
              onChange={(v) =>
                setSpec((s) => {
                  if (isHeatmapChartSpec(s)) s.layout.columnLabelOffsetY = v
                })
              }
            />
          </InspectorReveal>
          <InspectorReveal show={spec.axes.y.show}>
            <SliderControl
              label="Row label X"
              value={heatmapLayout?.rowLabelOffsetX ?? 0}
              min={-80}
              max={80}
              step={1}
              onChange={(v) =>
                setSpec((s) => {
                  if (isHeatmapChartSpec(s)) s.layout.rowLabelOffsetX = v
                })
              }
            />
            <SliderControl
              label="Row label Y"
              value={heatmapLayout?.rowLabelOffsetY ?? 0}
              min={-40}
              max={40}
              step={1}
              onChange={(v) =>
                setSpec((s) => {
                  if (isHeatmapChartSpec(s)) s.layout.rowLabelOffsetY = v
                })
              }
            />
          </InspectorReveal>
          <SwitchRow
            label="Color scale"
            checked={spec.legend.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.legend.show = checked })}
          />
        </InspectorReveal>

        <InspectorReveal show={cartLayout != null}>
          <SwitchRow
            label="X axis"
            checked={spec.axes.x.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.axes.x.show = checked })}
          />
          <InspectorReveal show={spec.axes.x.show}>
            <InspectorTextField
              label="X axis title"
              value={spec.axes.x.label}
              onChange={(v) => setSharedSpec((s) => { s.axes.x.label = v })}
            />
            <SliderControl
              label="X tick count"
              value={spec.axes.x.tickCount}
              min={2}
              max={12}
              step={1}
              onChange={(v) => setSharedSpec((s) => { s.axes.x.tickCount = v })}
            />
          </InspectorReveal>
          <SwitchRow
            label="Y axis"
            checked={spec.axes.y.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.axes.y.show = checked })}
          />
          <InspectorReveal show={spec.axes.y.show}>
            <InspectorTextField
              label="Y axis title"
              value={spec.axes.y.label}
              onChange={(v) => setSharedSpec((s) => { s.axes.y.label = v })}
            />
            <SliderControl
              label="Y tick count"
              value={spec.axes.y.tickCount}
              min={2}
              max={12}
              step={1}
              onChange={(v) => setSharedSpec((s) => { s.axes.y.tickCount = v })}
            />
          </InspectorReveal>

          <SwitchRow
            label="Show grid"
            checked={spec.grid.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.grid.show = checked })}
          />
          <InspectorReveal show={spec.grid.show}>
            <SliderControl
              label="Grid opacity"
              value={spec.grid.opacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setSharedSpec((s) => { s.grid.opacity = v })}
            />
            <SliderControl
              label="Grid stroke width"
              value={spec.grid.strokeWidth}
              min={0.5}
              max={4}
              step={0.5}
              onChange={(v) => setSharedSpec((s) => { s.grid.strokeWidth = v })}
            />
            <InspectorTextField
              label="Dash pattern (comma px)"
              value={dashToInput(spec.grid.dash)}
              onChange={(v) =>
                setSharedSpec((s) => {
                  s.grid.dash = parseDashInput(v)
                })
              }
              placeholder="4, 4"
            />
          </InspectorReveal>
        </InspectorReveal>

        <InspectorReveal show={!isHeatmap}>
          <SwitchRow
            label="Show legend"
            checked={spec.legend.show}
            onCheckedChange={(checked) => setSharedSpec((s) => { s.legend.show = checked })}
          />
          <InspectorReveal show={spec.legend.show}>
            <InspectorSelect
              label="Position"
              value={spec.legend.position}
              options={[
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
              onChange={(v) =>
                setSharedSpec((s) => {
                  s.legend.position = v as 'top' | 'bottom' | 'left' | 'right'
                })
              }
            />
          </InspectorReveal>
        </InspectorReveal>
      </InspectorSection>

      <InspectorSection title="Interaction & animation" defaultOpen={false}>
        <SwitchRow
          label="Hover"
          checked={spec.interaction.hover}
          onCheckedChange={(checked) => setSharedSpec((s) => { s.interaction.hover = checked })}
        />
        <SwitchRow
          label="Select"
          checked={spec.interaction.select}
          onCheckedChange={(checked) => setSharedSpec((s) => { s.interaction.select = checked })}
        />
        <SwitchRow
          label="Focus (keyboard)"
          checked={spec.interaction.focus}
          onCheckedChange={(checked) => setSharedSpec((s) => { s.interaction.focus = checked })}
        />

        <SwitchRow
          label="Animation enabled"
          checked={spec.animation.enabled}
          onCheckedChange={(checked) => setSharedSpec((s) => { s.animation.enabled = checked })}
        />
        <SliderControl
          label="Duration (ms)"
          value={spec.animation.duration}
          min={0}
          max={3000}
          step={50}
          onChange={(v) => setSharedSpec((s) => { s.animation.duration = v })}
        />
        <SliderControl
          label="Delay (ms)"
          value={spec.animation.delay}
          min={0}
          max={2000}
          step={50}
          onChange={(v) => setSharedSpec((s) => { s.animation.delay = v })}
        />
        <SliderControl
          label="Stagger (ms)"
          value={spec.animation.stagger}
          min={0}
          max={200}
          step={10}
          onChange={(v) => setSharedSpec((s) => { s.animation.stagger = v })}
        />

        <InspectorSelect
          label={isHeatmap ? 'Cell reveal direction' : 'Direction'}
          value={spec.animation.direction}
          options={[
            { value: 'left-right', label: 'Left → right' },
            { value: 'right-left', label: 'Right → left' },
            { value: 'top-bottom', label: 'Top → bottom' },
            { value: 'bottom-top', label: 'Bottom → top' },
          ]}
          onChange={(v) =>
            setSharedSpec((s) => {
              s.animation.direction = v as ChartSpec['animation']['direction']
            })
          }
        />
        <InspectorReveal show={!isHeatmap}>
          <InspectorSelect
            label="Trigger (metadata)"
            value={spec.animation.trigger}
            options={[
              { value: 'load', label: 'Load' },
              { value: 'replay', label: 'Replay' },
              { value: 'expand', label: 'Expand' },
            ]}
            onChange={(v) =>
              setSharedSpec((s) => {
                s.animation.trigger = v as ChartSpec['animation']['trigger']
              })
            }
          />
        </InspectorReveal>

        <InspectorSelect
          label="Easing preset"
          value={spec.animation.easing}
          options={[
            { value: 'linear', label: 'Linear' },
            { value: 'ease-in', label: 'Ease In' },
            { value: 'ease-out', label: 'Ease Out' },
            { value: 'ease-in-out', label: 'Ease In Out' },
            { value: 'spring', label: 'Spring' },
            { value: 'custom', label: 'Custom Bezier' },
          ]}
          onChange={(v) =>
            setSharedSpec((s) => {
              const preset = v as EasingPreset
              s.animation.easing = preset
              if (preset !== 'custom') {
                s.animation.customBezier = [...EASING_BEZIER[preset]]
              }
            })
          }
        />
        <InspectorReveal show={spec.animation.enabled}>
          <BezierEasingControl
            value={spec.animation.customBezier}
            onChange={(next) =>
              setSharedSpec((s) => {
                s.animation.customBezier = next
                s.animation.easing = 'custom'
              })
            }
          />
        </InspectorReveal>
      </InspectorSection>

      <InspectorSection title="Advanced" defaultOpen={false}>
        <SwitchRow
          label="Auto device pixel ratio"
          checked={spec.renderer.devicePixelRatio === 'auto'}
          onCheckedChange={(checked) =>
            setSharedSpec((s) => {
              s.renderer.devicePixelRatio = checked ? 'auto' : 2
            })
          }
        />
        <InspectorReveal show={spec.renderer.devicePixelRatio !== 'auto'}>
          <SliderControl
            label="Pixel ratio"
            value={
              spec.renderer.devicePixelRatio === 'auto' ? 2 : spec.renderer.devicePixelRatio
            }
            min={1}
            max={3}
            step={0.25}
            onChange={(v) => setSharedSpec((s) => { s.renderer.devicePixelRatio = v })}
          />
        </InspectorReveal>
        <SwitchRow
          label="Antialias"
          checked={spec.renderer.antialias}
          onCheckedChange={(checked) => setSharedSpec((s) => { s.renderer.antialias = checked })}
        />
        <InspectorReveal show={listLayout != null && !isHeatmap}>
          <SwitchRow
            label="Chevrons (reserved)"
            checked={listLayout?.showChevron ?? false}
            onCheckedChange={(checked) =>
              setSpec((s) => {
                if (s.layout.mode === 'list') s.layout.showChevron = checked
              })
            }
          />
        </InspectorReveal>
      </InspectorSection>
    </>
  )
}
