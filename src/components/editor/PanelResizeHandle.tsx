import { useRef } from 'react'
import { cn } from '../../lib/utils'

type PanelResizeHandleProps = {
  onDrag: (deltaX: number) => void
  className?: string
}

export function PanelResizeHandle({ onDrag, className }: PanelResizeHandleProps) {
  const startX = useRef(0)

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn(
        'w-1 shrink-0 cursor-col-resize touch-none',
        'hover:bg-border/80 active:bg-border transition-colors',
        className,
      )}
      onPointerDown={(e) => {
        startX.current = e.clientX
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const dx = e.clientX - startX.current
        startX.current = e.clientX
        onDrag(dx)
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
    />
  )
}
