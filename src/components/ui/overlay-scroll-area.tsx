import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../../lib/utils'

const MIN_THUMB_PX = 28

type ThumbState = {
  hasOverflow: boolean
  top: number
  height: number
}

type OverlayScrollAreaProps = {
  className?: string
  viewportClassName?: string
  padded?: boolean
  hostStyle?: CSSProperties
  hostRef?: Ref<HTMLDivElement>
  viewportRef?: Ref<HTMLDivElement>
  children: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (!ref) return
  if (typeof ref === 'function') ref(value)
  else ref.current = value
}

export function OverlayScrollArea({
  className,
  viewportClassName,
  padded,
  hostStyle,
  hostRef,
  viewportRef,
  children,
  ...viewportProps
}: OverlayScrollAreaProps) {
  const localHostRef = useRef<HTMLDivElement>(null)
  const localViewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null)
  const [thumbDragging, setThumbDragging] = useState(false)
  const [thumb, setThumb] = useState<ThumbState>({
    hasOverflow: false,
    top: 0,
    height: 0,
  })

  const updateThumb = useCallback(() => {
    const el = localViewportRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight <= clientHeight + 1) {
      setThumb({ hasOverflow: false, top: 0, height: 0 })
      return
    }
    const track = clientHeight
    const height = Math.max(MIN_THUMB_PX, (clientHeight / scrollHeight) * track)
    const maxTop = track - height
    const scrollable = scrollHeight - clientHeight
    const top = scrollable > 0 ? (scrollTop / scrollable) * maxTop : 0
    setThumb({ hasOverflow: true, top, height })
  }, [])

  useEffect(() => {
    const el = localViewportRef.current
    if (!el) return

    updateThumb()
    el.addEventListener('scroll', updateThumb, { passive: true })
    const ro = new ResizeObserver(updateThumb)
    ro.observe(el)
    const mo = new MutationObserver(updateThumb)
    mo.observe(el, { childList: true, subtree: true, attributes: true })

    return () => {
      el.removeEventListener('scroll', updateThumb)
      ro.disconnect()
      mo.disconnect()
    }
  }, [updateThumb])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current
      const el = localViewportRef.current
      if (!drag || !el || !thumb.hasOverflow) return
      const track = el.clientHeight
      const maxTop = track - thumb.height
      const scrollable = el.scrollHeight - el.clientHeight
      if (maxTop <= 0 || scrollable <= 0) return
      const deltaY = e.clientY - drag.startY
      const scrollDelta = (deltaY / maxTop) * scrollable
      el.scrollTop = drag.startScrollTop + scrollDelta
    }
    const onUp = () => {
      dragRef.current = null
      setThumbDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [thumb.hasOverflow, thumb.height])

  const onThumbMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = localViewportRef.current
    if (!el) return
    dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop }
    setThumbDragging(true)
  }

  return (
    <div
      ref={(node) => {
        localHostRef.current = node
        setRef(hostRef, node)
      }}
      style={hostStyle}
      className={cn(
        'euclid-scroll-host',
        padded && 'euclid-scroll-padded',
        thumbDragging && 'euclid-scroll-dragging',
        className,
      )}
    >
      <div
        ref={(node) => {
          localViewportRef.current = node
          setRef(viewportRef, node)
        }}
        className={cn(
          'euclid-scroll-viewport overflow-y-auto overflow-x-hidden',
          viewportClassName,
        )}
        {...viewportProps}
      >
        {children}
      </div>
      {thumb.hasOverflow && (
        <div className="euclid-scroll-overlay-track" aria-hidden>
          <div
            className="euclid-scroll-overlay-thumb"
            style={{ transform: `translateY(${thumb.top}px)`, height: thumb.height }}
            onMouseDown={onThumbMouseDown}
          />
        </div>
      )}
    </div>
  )
}
