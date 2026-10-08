import iro from '@jaames/iro'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import type { ChartSpec } from '../../../chart-spec/types'
import { MAX_PALETTE_BASE_COUNT } from '../../../visualization-colors/constants'
import type { VisualizationPaletteConfig } from '../../../visualization-colors/types'
import { requiredColorCount, resolvePalettePreview, resolvePaletteSequence } from '../../../visualization-colors/resolve'
import { baseThemedHex } from '../../../visualization-colors/variantGenerator'
import type { ChartTheme } from '../../../visualization-colors/types'
import { ColorSequenceDot } from './ColorSequenceDot'
import { IRO_WHEEL_LAYOUT } from './iroWheelLayout'
import { computeWheelLabels } from './paletteWheelLabels'

export const DEFAULT_PALETTE_WHEEL_SIZE = 200

type OklchPaletteWheelProps = {
  spec: ChartSpec
  theme: ChartTheme
  config: VisualizationPaletteConfig
  onChange: (patch: (prev: VisualizationPaletteConfig) => VisualizationPaletteConfig) => void
  size?: number
  className?: string
  wheelWrapRef?: RefObject<HTMLDivElement | null>
  /** When false, skips iro so only one picker runs in the app. */
  interactive?: boolean
}

export function OklchPaletteWheel({
  spec,
  theme,
  config,
  onChange,
  size = DEFAULT_PALETTE_WHEEL_SIZE,
  className,
  wheelWrapRef: wheelWrapRefProp,
  interactive = true,
}: OklchPaletteWheelProps) {
  const localWrapRef = useRef<HTMLDivElement>(null)
  const wheelWrapRef = wheelWrapRefProp ?? localWrapRef
  const mountRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<ReturnType<typeof iro.ColorPicker> | null>(null)
  const syncingColorsRef = useRef(false)
  const wheelDragRef = useRef(false)
  const configRef = useRef(config)
  const onChangeRef = useRef(onChange)
  configRef.current = config
  onChangeRef.current = onChange

  const wheelLayout = useMemo(
    () => ({ ...IRO_WHEEL_LAYOUT, width: size }),
    [size],
  )

  const count = requiredColorCount(spec)
  const sequence = useMemo(
    () => resolvePaletteSequence(config, theme, count),
    [config, theme, count],
  )
  const preview = useMemo(
    () => resolvePalettePreview(config, theme, count),
    [config, theme, count],
  )
  const startHex = useMemo(
    () => baseThemedHex(config.startHue, config, theme),
    [config, theme],
  )

  const wheelColors = useMemo(
    () => [startHex, ...preview.slice(0, Math.min(count, MAX_PALETTE_BASE_COUNT))],
    [startHex, preview, count],
  )
  const wheelColorsKey = wheelColors.join('|')
  const wheelColorsRef = useRef(wheelColors)
  wheelColorsRef.current = wheelColors
  const appliedColorsKeyRef = useRef('')

  const [wheelOffset, setWheelOffset] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!interactive) return
    const wrap = wheelWrapRef.current
    const mount = mountRef.current
    if (!wrap || !mount) return

    const measure = () => {
      const wheelEl = mount.querySelector('.IroWheel')
      if (!wheelEl) return
      const wrapRect = wrap.getBoundingClientRect()
      const wheelRect = wheelEl.getBoundingClientRect()
      const x = wheelRect.left - wrapRect.left
      const y = wheelRect.top - wrapRect.top
      setWheelOffset((prev) => (prev.x === x && prev.y === y ? prev : { x, y }))
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(wrap)
    ro.observe(mount)
    return () => ro.disconnect()
  }, [interactive, size, wheelWrapRef, wheelColorsKey])

  const wheelLabels = useMemo(
    () => computeWheelLabels(sequence, wheelLayout, wheelOffset.x, wheelOffset.y),
    [sequence, wheelLayout, wheelOffset.x, wheelOffset.y],
  )

  useEffect(() => {
    if (!interactive) {
      pickerRef.current = null
      const mount = mountRef.current
      if (mount) mount.innerHTML = ''
      return
    }

    const mount = mountRef.current
    if (!mount) return

    const initial = wheelColorsRef.current
    const picker = iro.ColorPicker(mount, {
      width: size,
      color: initial[0] ?? '#808080',
      colors: initial,
      layout: [{ component: iro.ui.Wheel, options: {} }],
    })
    pickerRef.current = picker
    picker.setActiveColor(0)
    appliedColorsKeyRef.current = initial.join('|')

    const applyStartHueFromPicker = () => {
      const h = picker.color.hsv.h ?? configRef.current.startHue
      const next = normalizeWheelHue(h)
      if (next === configRef.current.startHue) return
      onChangeRef.current((prev) => ({ ...prev, startHue: next }))
    }

    const onInputStart = () => {
      wheelDragRef.current = true
    }

    const onColorChange = () => {
      if (syncingColorsRef.current) return
      if (picker.color.index !== 0) {
        syncingColorsRef.current = true
        picker.setColors(wheelColorsRef.current, 0)
        syncingColorsRef.current = false
        return
      }
      applyStartHueFromPicker()
    }

    const onInputEnd = () => {
      wheelDragRef.current = false
      if (picker.color.index === 0) applyStartHueFromPicker()
    }

    picker.on('input:start', onInputStart)
    picker.on('color:change', onColorChange)
    picker.on('input:end', onInputEnd)

    return () => {
      picker.off('input:start', onInputStart)
      picker.off('color:change', onColorChange)
      picker.off('input:end', onInputEnd)
      pickerRef.current = null
      mount.innerHTML = ''
    }
  }, [interactive, count, size])

  useEffect(() => {
    if (!interactive) return
    const picker = pickerRef.current
    if (!picker) return

    if (wheelDragRef.current) {
      syncingColorsRef.current = true
      for (let i = 1; i < wheelColors.length; i++) {
        const hex = wheelColors[i]
        const handle = picker.colors[i]
        if (hex && handle && handle.hexString !== hex) {
          handle.hexString = hex
        }
      }
      syncingColorsRef.current = false
      appliedColorsKeyRef.current = wheelColorsKey
      return
    }

    if (appliedColorsKeyRef.current === wheelColorsKey) return
    appliedColorsKeyRef.current = wheelColorsKey
    syncingColorsRef.current = true
    const active = picker.color.index === 0 ? 0 : picker.color.index
    picker.setColors(wheelColors, active)
    syncingColorsRef.current = false
  }, [interactive, wheelColorsKey, wheelColors])

  useEffect(() => {
    if (!interactive || wheelDragRef.current) return
    const picker = pickerRef.current
    if (!picker?.colors[0]) return
    if (picker.colors[0].hexString === startHex) return
    syncingColorsRef.current = true
    picker.colors[0].hexString = startHex
    syncingColorsRef.current = false
  }, [interactive, startHex])

  return (
    <div
      ref={wheelWrapRef}
      className={className ?? 'relative mx-auto aspect-square w-full max-w-[200px]'}
      style={{ maxWidth: size }}
    >
      {interactive ? (
        <div
          ref={mountRef}
          className="iro-numbered-wheel iro-host [&_.IroColorPicker]:!bg-transparent [&_.IroHandle_circle]:opacity-0"
        />
      ) : (
        <div ref={mountRef} className="sr-only" aria-hidden />
      )}
      {interactive && (
        <div className="pointer-events-none absolute inset-0">
          {wheelLabels.map((label) => (
            <ColorSequenceDot
              key={label.sequence}
              sequence={label.sequence}
              hex={label.hex}
              variant="wheel"
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: label.x, top: label.y }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function normalizeWheelHue(h: number): number {
  const n = ((h % 360) + 360) % 360
  return Math.round(n * 10) / 10
}
