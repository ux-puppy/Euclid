import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react'
import { computeLayout } from '../../layout/bar/computeLayout'
import { computeAnimProgress } from '../../render/animation'
import { isTreeLayoutAnimating } from '../../layout/bar/treeRowAnim'
import { subscribePreviewTicker } from '../../render/previewTicker'
import { hitTest, renderScene } from '../../render/renderer'
import { useEditorStore } from '../../store/editorStore'
import type { ChartSpec } from '../../chart-spec/types'
import { isBarChartSpec, isHeatmapChartSpec } from '../../chart-spec/types'
import { OverlayScrollArea } from '../ui/overlay-scroll-area'

const MIN_LAYOUT_WIDTH = 320

/** Layout width so scene.width × zoom fills the visible viewport width. */
function specForPreviewWidth(
  spec: ChartSpec,
  viewportWidth: number,
  zoom: number,
): ChartSpec {
  const z = Math.max(zoom, 0.1)
  const width = Math.max(MIN_LAYOUT_WIDTH, Math.floor(viewportWidth / z + 0.5))
  if (isHeatmapChartSpec(spec)) {
    return spec
  }
  if (isBarChartSpec(spec)) {
    return { ...spec, layout: { ...spec.layout, width } }
  }
  return spec
}

function readPreviewViewportWidth(
  scrollEl: HTMLDivElement | null,
  hostEl: HTMLDivElement | null,
  chartPadding: number,
  fallback: number,
): number {
  if (scrollEl && scrollEl.clientWidth > 0) {
    return scrollEl.clientWidth
  }
  if (hostEl) {
    return Math.max(0, hostEl.clientWidth - chartPadding * 2)
  }
  return fallback
}

export type ChartCanvasHandle = {
  getFitZoom: () => number
  getDisplaySceneHeight: () => number
}

export type ChartCanvasProps = {
  spec?: ChartSpec
  interactive?: boolean
  /** When false, host has no euclid-scroll-padded inset (e.g. stacked preview cards). */
  padded?: boolean
  /** Ctrl+wheel zoom without hover/select interaction. */
  allowZoomWheel?: boolean
}

function staticExpandedIds(spec: ChartSpec): string[] {
  if (spec.data.shape !== 'tree') return []
  if (spec.data.expandedNodeIds?.length) return [...spec.data.expandedNodeIds]
  return []
}

export const ChartCanvas = forwardRef<ChartCanvasHandle, ChartCanvasProps>(function ChartCanvas(
  { spec: specProp, interactive = true, padded = true, allowZoomWheel },
  ref,
) {
  const zoomWheel = allowZoomWheel ?? interactive
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewHostRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const displayZoomRef = useRef(1)
  const displaySceneHeightRef = useRef(400)
  const sceneSizeRef = useRef({ width: 640, height: 400 })
  const dirtyRef = useRef(true)
  const previewContentWidthRef = useRef(640)
  const lastBarTargetsRef = useRef<Record<string, number>>({})
  const valueAnimFromRef = useRef<Record<string, number> | null>(null)
  const dataAnimSigRef = useRef('')

  const storeSpec = useEditorStore((s) => s.spec)
  const spec = specProp ?? storeSpec
  const ui = useEditorStore((s) => s.ui)
  const selectedChart = useEditorStore((s) => s.selectedChart)
  const usesLiveUi =
    interactive &&
    (specProp == null ||
      (specProp.chartType === 'heatmap'
        ? selectedChart === 'heatmap'
        : specProp.variant === storeSpec.variant && storeSpec.chartType === 'bar'))
  const expandedIds = usesLiveUi ? ui.expandedNodeIds : staticExpandedIds(spec)
  const collapsedIds = usesLiveUi ? ui.collapsedNodeIds : []
  const setTargetZoom = useEditorStore((s) => s.setTargetZoom)
  const setHoverId = useEditorStore((s) => s.setHoverId)
  const setSelectId = useEditorStore((s) => s.setSelectId)
  const toggleNode = useEditorStore((s) => s.toggleNode)
  const beginTreeLayoutAnim = useEditorStore((s) => s.beginTreeLayoutAnim)

  useEffect(() => {
    const sig = `${ui.animKey}:${spec.variant}:${JSON.stringify(spec.data)}`
    if (dataAnimSigRef.current && dataAnimSigRef.current !== sig) {
      valueAnimFromRef.current = { ...lastBarTargetsRef.current }
    }
    dataAnimSigRef.current = sig
    dirtyRef.current = true
  }, [spec.data, spec.variant, ui.animKey])

  useEffect(() => {
    const host = previewHostRef.current
    if (!host) return

    const syncWidth = () => {
      previewContentWidthRef.current = readPreviewViewportWidth(
        containerRef.current,
        host,
        spec.chartPadding,
        previewContentWidthRef.current,
      )
      dirtyRef.current = true
    }

    syncWidth()
    const ro = new ResizeObserver(syncWidth)
    ro.observe(host)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [spec.chartPadding])

  const layoutSpecForInteraction = useCallback(() => {
    const viewportW = readPreviewViewportWidth(
      containerRef.current,
      previewHostRef.current,
      spec.chartPadding,
      previewContentWidthRef.current,
    )
    return specForPreviewWidth(spec, viewportW, displayZoomRef.current)
  }, [spec, spec.chartPadding])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const z = displayZoomRef.current
    const dpr =
      spec.renderer.devicePixelRatio === 'auto'
        ? window.devicePixelRatio
        : spec.renderer.devicePixelRatio

    const elapsed = performance.now() - ui.animStart
    let animProgress = 1
    if (spec.animation.enabled) {
      animProgress = computeAnimProgress(spec.animation, elapsed, 0)
    }
    const valueAnim = {
      t: animProgress,
      from: valueAnimFromRef.current,
    }

    const viewportW = readPreviewViewportWidth(
      containerRef.current,
      previewHostRef.current,
      spec.chartPadding,
      previewContentWidthRef.current,
    )
    previewContentWidthRef.current = viewportW

    const layoutSpec = specForPreviewWidth(spec, viewportW, z)

    const scene = computeLayout(layoutSpec, {
      theme: ui.theme,
      hoverId: usesLiveUi ? ui.hoverId : null,
      selectId: usesLiveUi ? ui.selectId : null,
      expandedIds,
      collapsedIds,
      animProgress,
      valueAnim,
      animElapsedMs: elapsed,
      treeRevealAnimStart: usesLiveUi ? ui.treeRevealAnimStart : null,
      treeRevealRowIds: usesLiveUi ? ui.treeRevealRowIds : [],
      treeHideRowIds: usesLiveUi ? ui.treeHideRowIds : [],
      treeAnimUseBeforeLayout: usesLiveUi ? ui.treeAnimUseBeforeLayout : false,
      treeAnimLayoutExpanded: usesLiveUi ? ui.treeAnimLayoutExpanded : [],
      treeAnimLayoutCollapsed: usesLiveUi ? ui.treeAnimLayoutCollapsed : [],
    })

    sceneSizeRef.current = { width: scene.width, height: scene.height }

    const layoutAnimating =
      spec.variant === 'hierarchy' &&
      isTreeLayoutAnimating(
        spec,
        ui.treeRevealAnimStart,
        ui.treeRevealRowIds,
        ui.treeHideRowIds,
      )

    const autoChartHeight =
      layoutSpec.layout.height === 'auto'

    let displayH = scene.height
    if (
      !autoChartHeight &&
      spec.variant === 'hierarchy' &&
      spec.animation.enabled &&
      !layoutAnimating
    ) {
      if (ui.treeRevealAnimStart != null) {
        displayH = scene.height
      } else {
        const loadProgress = computeAnimProgress(spec.animation, elapsed, 0)
        if (loadProgress < 1) {
          const fromH = ui.treeLayoutFromHeight
          displayH = fromH + (scene.height - fromH) * loadProgress
        }
      }
    }

    displaySceneHeightRef.current = displayH
    canvas.width = scene.width * dpr * z
    canvas.height = displayH * dpr * z
    const cssW = scene.width * z
    const cssH = displayH * z
    if (layoutSpec.chartType === 'heatmap') {
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
    } else {
      canvas.style.width = '100%'
      canvas.style.height = `${cssH}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr * z, 0, 0, dpr * z, 0, 0)
    renderScene(ctx, scene, layoutSpec, ui.theme, displayH)

    if (animProgress >= 1) {
      const next: Record<string, number> = {}
      for (const row of scene.barRows) {
        next[row.id] = row.barWidth
      }
      lastBarTargetsRef.current = next
    }

    canvas.dataset.sceneHeight = String(scene.height)
  }, [
    spec,
    spec.animation.duration,
    spec.animation.delay,
    spec.animation.easing,
    spec.animation.customBezier,
    spec.animation.enabled,
    spec.chartPadding,
    ui.animStart,
    ui.animKey,
    usesLiveUi,
    ui.hoverId,
    ui.selectId,
    expandedIds,
    collapsedIds,
    ui.treeRevealAnimStart,
    ui.treeRevealRowIds,
    ui.treeHideRowIds,
    ui.treeAnimUseBeforeLayout,
    ui.treeLayoutFromHeight,
    ui.theme,
  ])

  useEffect(() => {
    dirtyRef.current = true
  }, [draw])

  useImperativeHandle(ref, () => ({
    getFitZoom: () => {
      const scrollEl = containerRef.current
      const host = previewHostRef.current
      if (!host) return 1
      const { width: layoutW, height: layoutH } = sceneSizeRef.current
      const cw = scrollEl?.clientWidth ?? host.clientWidth
      const ch = scrollEl?.clientHeight ?? host.clientHeight
      if (layoutW <= 0 || layoutH <= 0) return 1
      return Math.min(cw / layoutW, ch / layoutH, 3)
    },
    getDisplaySceneHeight: () => displaySceneHeightRef.current,
  }))

  useEffect(() => {
    const subscriber = {
      tick: () => {
        const state = useEditorStore.getState()
        const target = state.ui.targetZoom
        const current = displayZoomRef.current
        const nextZoom = current + (target - current) * 0.15
        const zoomDone = Math.abs(target - nextZoom) < 0.001
        displayZoomRef.current = zoomDone ? target : nextZoom

        const elapsed = performance.now() - state.ui.animStart
        const isHierarchy = spec.variant === 'hierarchy'
        const treeLayoutAnimating =
          usesLiveUi &&
          isHierarchy &&
          isTreeLayoutAnimating(
            spec,
            state.ui.treeRevealAnimStart,
            state.ui.treeRevealRowIds,
            state.ui.treeHideRowIds,
          )
        const heightDone = !treeLayoutAnimating
        const globalLoadAnimating =
          spec.animation.enabled &&
          !isHierarchy &&
          computeAnimProgress(spec.animation, elapsed, 0) < 1
        const heatmapLoadAnimating =
          spec.chartType === 'heatmap' &&
          spec.animation.enabled &&
          computeAnimProgress(spec.animation, elapsed, 0) < 1
        const hierarchyLoadAnimating =
          spec.animation.enabled &&
          isHierarchy &&
          (!usesLiveUi || state.ui.treeRevealAnimStart == null) &&
          elapsed <
            spec.animation.delay +
              spec.animation.duration +
              spec.animation.stagger * 48
        const needsFrame =
          dirtyRef.current ||
          !zoomDone ||
          !heightDone ||
          globalLoadAnimating ||
          heatmapLoadAnimating ||
          hierarchyLoadAnimating ||
          treeLayoutAnimating

        if (needsFrame) {
          draw()
          dirtyRef.current = false
        }

        if (
          usesLiveUi &&
          state.ui.treeRevealAnimStart != null &&
          heightDone &&
          !treeLayoutAnimating
        ) {
          useEditorStore.getState().clearTreeRevealAnim()
        }
      },
    }
    return subscribePreviewTicker(subscriber)
  }, [draw, spec, usesLiveUi])

  const pointerToScene = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    const layoutW = sceneSizeRef.current.width
    const layoutHeight =
      displaySceneHeightRef.current ||
      Number(canvas.dataset.sceneHeight) ||
      sceneSizeRef.current.height
    return {
      x: ((e.clientX - rect.left) / rect.width) * layoutW,
      y: ((e.clientY - rect.top) / rect.height) * layoutHeight,
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!zoomWheel) return
    if (!e.ctrlKey) return
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * 0.002)
    const current = useEditorStore.getState().ui.targetZoom
    setTargetZoom(current * factor)
  }

  const valueAnimForInteraction = () => {
    const elapsed = performance.now() - ui.animStart
    const t = spec.animation.enabled ? computeAnimProgress(spec.animation, elapsed, 0) : 1
    return { t, from: valueAnimFromRef.current }
  }

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!usesLiveUi || !spec.interaction.hover) return
    const pt = pointerToScene(e)
    if (!pt) return
    const scene = computeLayout(layoutSpecForInteraction(), {
      theme: ui.theme,
      hoverId: ui.hoverId,
      selectId: ui.selectId,
      expandedIds,
      collapsedIds,
      animProgress: 1,
      valueAnim: valueAnimForInteraction(),
    })
    const hit = hitTest(scene, pt.x, pt.y)
    setHoverId(hit?.id ?? null)
  }

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!usesLiveUi) return
    const pt = pointerToScene(e)
    if (!pt) return
    const scene = computeLayout(layoutSpecForInteraction(), {
      theme: ui.theme,
      hoverId: ui.hoverId,
      selectId: ui.selectId,
      expandedIds,
      collapsedIds,
      animProgress: 1,
      valueAnim: valueAnimForInteraction(),
    })
    const hit = hitTest(scene, pt.x, pt.y)
    if (!hit) return

    const nodeId = String(hit.meta?.nodeId ?? hit.id)

    if (
      spec.variant === 'hierarchy' &&
      spec.data.shape === 'tree' &&
      hit.meta?.hasChildren
    ) {
      beginTreeLayoutAnim(displaySceneHeightRef.current)
      toggleNode(nodeId)
      return
    }

    if (spec.interaction.select) setSelectId(hit.id)
  }

  return (
    <OverlayScrollArea
      hostRef={previewHostRef}
      viewportRef={containerRef}
      padded={padded}
      hostStyle={
        {
          '--euclid-chart-inset': `${spec.chartPadding}px`,
          ...(padded
            ? { borderRadius: `${spec.containerCornerRadius ?? 12}px`, overflow: 'hidden' as const }
            : {}),
        } as CSSProperties
      }
      className="flex flex-1 min-h-0 min-w-0"
      viewportClassName="flex w-full min-w-0 items-start justify-start"
      onWheel={onWheel}
    >
      <canvas
        ref={canvasRef}
        className="block w-full max-w-none shrink-0"
        onMouseMove={onMove}
        onMouseLeave={() => {
          if (!usesLiveUi) return
          setHoverId(null)
        }}
        onClick={onClick}
      />
    </OverlayScrollArea>
  )
})
