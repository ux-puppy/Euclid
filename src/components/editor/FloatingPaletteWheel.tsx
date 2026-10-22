import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../lib/utils'
import { isBarChartSpec, isBarValueColorEncoding } from '../../chart-spec/types'
import { stripNudgedFillsFromConfig } from '../../visualization-colors/accessibilityNudge'
import { OklchPaletteWheel } from './inspector/OklchPaletteWheel'

const FLOATING_WHEEL_SIZE = 168
const MOTION_MS = 280

export function FloatingPaletteWheel() {
  const inspectorTab = useEditorStore((s) => s.ui.inspectorTab)
  const selectedChart = useEditorStore((s) => s.selectedChart)
  const paletteWheelInView = useEditorStore((s) => s.ui.paletteWheelInView)
  const spec = useEditorStore((s) => s.spec)
  const theme = useEditorStore((s) => s.ui.theme)
  const setSharedSpec = useEditorStore((s) => s.setSharedSpec)

  const shouldShow =
    selectedChart !== 'palette' &&
    inspectorTab === 'colors' &&
    !paletteWheelInView &&
    isBarChartSpec(spec) &&
    !isBarValueColorEncoding(spec.colors)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (shouldShow) {
      setMounted(true)
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), MOTION_MS)
    return () => clearTimeout(t)
  }, [shouldShow])

  if (!mounted) return null

  return (
    <div
      className={cn(
        'absolute bottom-3 right-3 z-20 w-[184px] rounded-xl border border-border bg-panel/90 p-2 shadow-lg backdrop-blur-sm',
        'transition-opacity duration-[280ms] ease-out motion-reduce:transition-none',
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
      aria-label="OKLCH color wheel"
      aria-hidden={!visible}
    >
      {isBarChartSpec(spec) && (
        <OklchPaletteWheel
          spec={spec}
          theme={theme}
          config={spec.colors.visualization}
          size={FLOATING_WHEEL_SIZE}
          interactive={visible}
          onChange={(patch) =>
            setSharedSpec((s) => {
              if (!isBarChartSpec(s)) return
              s.colors.visualization = stripNudgedFillsFromConfig(
                patch(s.colors.visualization),
              )
            })
          }
          className="relative aspect-square w-full"
        />
      )}
    </div>
  )
}
