import { useMemo } from 'react'
import { buildPaletteCatalog } from '../../chart-spec/paletteCatalog'
import { useEditorStore } from '../../store/editorStore'
import { OverlayScrollArea } from '../ui/overlay-scroll-area'
import { PaletteSwatchCard } from './PaletteSwatchCard'
export function PalettePane() {
  const specsByVariant = useEditorStore((s) => s.specsByVariant)
  const heatmapSpec = useEditorStore((s) => s.heatmapSpec)

  const catalog = useMemo(
    () => buildPaletteCatalog({ specsByVariant, heatmapSpec }),
    [specsByVariant, heatmapSpec],
  )

  return (
    <OverlayScrollArea className="flex-1 min-h-0">
      <div
        className="flex flex-col gap-8 max-w-5xl mx-auto w-full px-3.5 pt-4 pb-3.5"
      >
        {catalog.sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {section.entries.map((entry) => (
                <PaletteSwatchCard key={`${section.id}-${entry.token}`} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </OverlayScrollArea>
  )
}
