import { SegmentedControl } from '../ui/segmented-control'
import { ThemeToggle } from '../ui/theme-toggle'
import { ScrollArea } from '../ui/scroll-area'
import { useEditorStore } from '../../store/editorStore'
import { InspectorSettingsTab } from './inspector/InspectorSettingsTab'
import { InspectorColorsTab } from './inspector/InspectorColorsTab'
import { cn } from '../../lib/utils'
import { EDITOR_PANEL_SHELL_BG, EDITOR_PANEL_SHELL_RADIUS } from './editorShellChrome'

type InspectorPanelProps = {
  width: number
}

export function InspectorPanel({ width }: InspectorPanelProps) {
  const tab = useEditorStore((s) => s.ui.inspectorTab)
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab)
  const theme = useEditorStore((s) => s.ui.theme)
  const setTheme = useEditorStore((s) => s.setTheme)

  return (
    <aside
      style={{ width }}
      className={cn(
        'shrink-0 flex flex-col h-full min-h-0 overflow-hidden',
        EDITOR_PANEL_SHELL_BG,
        EDITOR_PANEL_SHELL_RADIUS,
      )}
    >
      <div className="flex min-h-[50px] items-center justify-between gap-2 px-3 border-b border-border shrink-0">
        <SegmentedControl
          options={[
            { value: 'settings', label: 'Settings' },
            { value: 'colors', label: 'Colors' },
          ]}
          value={tab}
          onChange={setInspectorTab}
        />
        <ThemeToggle theme={theme} onToggle={setTheme} />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {tab === 'settings' && <InspectorSettingsTab />}
        {tab === 'colors' && <InspectorColorsTab />}
      </ScrollArea>
    </aside>
  )
}

