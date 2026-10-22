import { useEffect } from 'react'
import { NavSidebar } from './NavSidebar'
import { PreviewPane } from './PreviewPane'
import { InspectorPanel } from './InspectorPanel'
import { PanelResizeHandle } from './PanelResizeHandle'
import { applyDocumentTheme, useEditorStore } from '../../store/editorStore'

export function AppShell() {
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const theme = useEditorStore((s) => s.ui.theme)
  const inspectorWidth = useEditorStore((s) => s.ui.inspectorWidth)
  const setInspectorWidth = useEditorStore((s) => s.setInspectorWidth)
  const nudgeInspectorWidth = (dx: number) =>
    setInspectorWidth(useEditorStore.getState().ui.inspectorWidth - dx)

  useEffect(() => {
    applyDocumentTheme(theme)
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <NavSidebar />
      <div className="flex flex-1 min-w-0 h-full min-h-0 gap-[2px] py-2 pr-2">
        <PreviewPane />
        <PanelResizeHandle onDrag={nudgeInspectorWidth} />
        <InspectorPanel width={inspectorWidth} />
      </div>
    </div>
  )
}
