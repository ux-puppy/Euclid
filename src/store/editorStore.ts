import { temporal } from 'zundo'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { syncPaletteAssignments } from '../visualization-colors/syncAssignments'
import {
  createHeatmapSpec,
  createInitialSpecsBundle,
  DEFAULT_TREE_MAX_DEPTH,
  syncVariantField,
} from '../chart-spec/defaults'
import {
  applySharedChartSettings,
  pickSharedChartSettings,
} from '../chart-spec/sharedSettings'
import {
  bundleForExport,
  parseImportedJSON,
  parseImportedPayload,
  specForExport,
} from '../chart-spec/exportImport'
import { assertBundleInvariant } from './bundleInvariant'
import { migrateChartSpec } from '../chart-spec/schema'
import type {
  BarChartSpec,
  ChartSpec,
  ChartVariant,
  DataNode,
  EditorChartId,
  HeatmapChartSpec,
  TabularPatternId,
  TreePatternId,
} from '../chart-spec/types'
import { deriveVariant, isBarChartSpec } from '../chart-spec/types'
import { generateTreeData, randomizeSeed } from '../data/generate'
import {
  applyUnifiedDataToBundle,
  applyUnifiedDataToHeatmap,
  unifiedParamsFromHeatmap,
  unifiedParamsFromSpecs,
  type UnifiedDataParams,
} from '../data/unifiedData'
import {
  allExpandedIds,
  findTreeNode,
  flattenVisibleTree,
  isTreeNodeExpanded,
} from '../layout/bar/flattenTree'

const STORAGE_KEY = 'euclid-spec-autosave'
const ALL_VARIANTS: ChartVariant[] = ['classic', 'breakdown', 'hierarchy']

export const VARIANT_LABELS: Record<ChartVariant, string> = {
  classic: 'Bar Chart',
  breakdown: 'Breakdown',
  hierarchy: 'Hierarchy',
}

export const CHART_LABELS: Record<EditorChartId, string> = {
  ...VARIANT_LABELS,
  heatmap: 'Heatmap',
}
const THEME_STORAGE_KEY = 'euclid-ui-theme'
const SHELL_STORAGE_KEY = 'euclid-shell-layout'

const INSPECTOR_WIDTH_DEFAULT = 262
const INSPECTOR_WIDTH_MIN = 220
const INSPECTOR_WIDTH_MAX = 420

function loadShellLayout(): { inspectorWidth: number } {
  try {
    const raw = localStorage.getItem(SHELL_STORAGE_KEY)
    if (!raw) return { inspectorWidth: INSPECTOR_WIDTH_DEFAULT }
    const parsed = JSON.parse(raw) as { inspectorWidth?: number; navWidth?: number }
    return {
      inspectorWidth: clampShell(
        parsed.inspectorWidth ?? INSPECTOR_WIDTH_DEFAULT,
        INSPECTOR_WIDTH_MIN,
        INSPECTOR_WIDTH_MAX,
      ),
    }
  } catch {
    return { inspectorWidth: INSPECTOR_WIDTH_DEFAULT }
  }
}

function clampShell(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function saveShellLayout(inspectorWidth: number) {
  try {
    localStorage.setItem(
      SHELL_STORAGE_KEY,
      JSON.stringify({ inspectorWidth }),
    )
  } catch {
    /* ignore */
  }
}

export function applyDocumentTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('light', theme === 'light')
}

function loadTheme(): 'dark' | 'light' {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* ignore */
  }
  return 'dark'
}

type UiState = {
  inspectorTab: 'settings' | 'colors'
  theme: 'dark' | 'light'
  inspectorWidth: number
  hoverId: string | null
  selectId: string | null
  expandedNodeIds: string[]
  collapsedNodeIds: string[]
  targetZoom: number
  animStart: number
  animKey: number
  treeRevealAnimStart: number | null
  treeRevealRowIds: string[]
  treeHideRowIds: string[]
  treeAnimUseBeforeLayout: boolean
  treeAnimLayoutExpanded: string[]
  treeAnimLayoutCollapsed: string[]
  treeLayoutFromHeight: number
  previewShowAllCharts: boolean
  /** Inspector OKLCH wheel intersects the colors tab scrollport. */
  paletteWheelInView: boolean
  treeUiByVariant: Partial<
    Record<ChartVariant, { expandedNodeIds: string[]; collapsedNodeIds: string[] }>
  >
}

type EditorState = {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
  selectedChart: EditorChartId
  ui: UiState
  setSpec: (updater: (spec: ChartSpec) => void) => void
  setSharedSpec: (updater: (spec: ChartSpec) => void) => void
  replaceSpec: (spec: ChartSpec) => void
  selectChart: (chart: EditorChartId) => void
  selectVariant: (variant: ChartVariant) => void
  setVariant: (variant: ChartVariant) => void
  setPreviewShowAllCharts: (show: boolean) => void
  setPattern: (pattern: TabularPatternId | TreePatternId) => void
  regenerateAllData: (patch?: Partial<UnifiedDataParams>) => void
  randomize: () => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setInspectorTab: (tab: UiState['inspectorTab']) => void
  setPaletteWheelInView: (inView: boolean) => void
  setInspectorWidth: (w: number) => void
  setHoverId: (id: string | null) => void
  setSelectId: (id: string | null) => void
  toggleNode: (id: string) => void
  expandAll: () => void
  collapseAll: () => void
  beginTreeLayoutAnim: (fromDisplayHeight: number) => void
  clearTreeRevealAnim: () => void
  setTargetZoom: (z: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomToFit: (fitScale: number) => void
  zoomTo100: () => void
  replayAnimation: () => void
  exportSpec: () => ChartSpec
  exportBundle: () => ReturnType<typeof bundleForExport>
  importSpec: (json: string) => void
  resetToDefault: () => void
  undo: () => void
  redo: () => void
}

function cloneChartSpec(spec: ChartSpec): ChartSpec {
  return parseImportedJSON(JSON.stringify(spec))
}

function createDefaultSpecsBundle(seed: BarChartSpec): Record<ChartVariant, BarChartSpec> {
  const shared = pickSharedChartSettings(seed)
  const bundle = createInitialSpecsBundle()
  for (const v of ALL_VARIANTS) {
    applySharedChartSettings(bundle[v], shared)
  }
  const normalized = normalizeTreeMaxDepth(syncVariantField(cloneChartSpec(seed))) as BarChartSpec
  bundle[normalized.variant] = normalized
  const aligned = pickSharedChartSettings(bundle[normalized.variant])
  for (const v of ALL_VARIANTS) {
    applySharedChartSettings(bundle[v], aligned)
  }
  const params = unifiedParamsFromSpecs(bundle)
  if (seed.data.provenance) {
    params.seed = seed.data.provenance.seed
    if (seed.data.shape === 'tabular') {
      params.pattern = seed.data.provenance.pattern as TabularPatternId
      const p = seed.data.provenance.params
      if (p.categoryCount != null) params.categoryCount = p.categoryCount
      if (p.seriesCount != null) params.seriesCount = p.seriesCount
    }
  }
  applyUnifiedDataToBundle(bundle, params)
  return bundle
}

function afterBarDataRefresh(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  selectedChart: EditorChartId
  ui: UiState
}) {
  for (const v of ALL_VARIANTS) {
    syncPaletteAssignments(state.specsByVariant[v])
  }
  syncActiveSpecSlot(state)
  loadTreeUiForSpec(state, state.spec)
  state.ui.animStart = performance.now()
  state.ui.animKey += 1
}

function afterHeatmapDataRefresh(state: {
  spec: ChartSpec
  heatmapSpec: HeatmapChartSpec
  selectedChart: EditorChartId
  ui: UiState
}) {
  syncActiveSpecSlot(state)
  state.ui.animStart = performance.now()
  state.ui.animKey += 1
}

type AutosaveBundleV3 = {
  version: 3
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
  selectedChart: EditorChartId
}

type AutosaveBundleV2 = {
  specsByVariant: Record<ChartVariant, BarChartSpec>
  selectedVariant: ChartVariant
}

function loadAutosaveBundle(): AutosaveBundleV3 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && 'version' in parsed && (parsed as { version: number }).version === 3) {
      const bag = parsed as AutosaveBundleV3
      const specsByVariant = {
        classic: migrateBundleSpec(bag.specsByVariant.classic) as BarChartSpec,
        breakdown: migrateBundleSpec(bag.specsByVariant.breakdown) as BarChartSpec,
        hierarchy: migrateBundleSpec(bag.specsByVariant.hierarchy) as BarChartSpec,
      }
      const heatmapSpec = migrateChartSpec(bag.heatmapSpec) as HeatmapChartSpec
      const selectedChart = bag.selectedChart
      if (selectedChart !== 'heatmap' && !ALL_VARIANTS.includes(selectedChart)) return null
      return { version: 3, specsByVariant, heatmapSpec, selectedChart }
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      'specsByVariant' in parsed &&
      'selectedVariant' in parsed
    ) {
      const bag = parsed as AutosaveBundleV2
      const specsByVariant = {
        classic: migrateBundleSpec(bag.specsByVariant.classic) as BarChartSpec,
        breakdown: migrateBundleSpec(bag.specsByVariant.breakdown) as BarChartSpec,
        hierarchy: migrateBundleSpec(bag.specsByVariant.hierarchy) as BarChartSpec,
      }
      const selected = bag.selectedVariant
      if (!ALL_VARIANTS.includes(selected)) return null
      const heatmapSpec = createHeatmapSpec()
      return {
        version: 3,
        specsByVariant,
        heatmapSpec,
        selectedChart: selected,
      }
    }
    const single = parseImportedJSON(raw)
    if (!isBarChartSpec(single)) {
      const heatmapSpec = single as HeatmapChartSpec
      const specsByVariant = createInitialSpecsBundle()
      return {
        version: 3,
        specsByVariant,
        heatmapSpec,
        selectedChart: 'heatmap',
      }
    }
    const specsByVariant = createDefaultSpecsBundle(single)
    const heatmapSpec = createHeatmapSpec()
    return {
      version: 3,
      specsByVariant,
      heatmapSpec,
      selectedChart: single.variant,
    }
  } catch {
    return null
  }
}

function migrateBundleSpec(raw: unknown): ChartSpec {
  return normalizeTreeMaxDepth(migrateChartSpec(raw))
}

function persistActiveSpecSlot(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
  selectedChart: EditorChartId
}) {
  if (state.selectedChart === 'heatmap') {
    state.heatmapSpec = state.spec as HeatmapChartSpec
  } else {
    const variant = state.selectedChart
    state.specsByVariant[variant] = state.spec as BarChartSpec
  }
}

function syncActiveSpecSlot(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
  selectedChart: EditorChartId
}) {
  state.spec =
    state.selectedChart === 'heatmap'
      ? state.heatmapSpec
      : state.specsByVariant[state.selectedChart]
}

function syncSharedToAllBarVariants(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  selectedChart: EditorChartId
}) {
  if (!isBarChartSpec(state.spec)) return
  const shared = pickSharedChartSettings(state.spec)
  for (const v of ALL_VARIANTS) {
    applySharedChartSettings(state.specsByVariant[v], shared)
  }
  if (state.selectedChart !== 'heatmap') {
    state.spec = state.specsByVariant[state.selectedChart]
  }
}

function finishBundleMutation(state: {
  spec: ChartSpec
  specsByVariant: Record<ChartVariant, BarChartSpec>
  heatmapSpec: HeatmapChartSpec
  selectedChart: EditorChartId
}) {
  assertBundleInvariant(state)
}

function saveTreeUiForVariant(state: {
  spec: ChartSpec
  ui: UiState
}) {
  if (!isBarChartSpec(state.spec) || state.spec.data.shape !== 'tree') return
  state.ui.treeUiByVariant[state.spec.variant] = {
    expandedNodeIds: [...state.ui.expandedNodeIds],
    collapsedNodeIds: [...state.ui.collapsedNodeIds],
  }
}

function loadTreeUiForSpec(state: { ui: UiState }, spec: ChartSpec) {
  const saved =
    isBarChartSpec(spec) ? state.ui.treeUiByVariant[spec.variant] : undefined
  if (spec.data.shape === 'tree' && saved) {
    state.ui.expandedNodeIds = [...saved.expandedNodeIds]
    state.ui.collapsedNodeIds = [...saved.collapsedNodeIds]
    return
  }
  state.ui.expandedNodeIds = initExpanded(spec)
  state.ui.collapsedNodeIds = initCollapsed(spec)
}

function normalizeTreeMaxDepth(spec: ChartSpec): ChartSpec {
  if (!isBarChartSpec(spec) || spec.data.shape !== 'tree' || !spec.data.provenance) return spec
  const stored = spec.data.provenance.params.maxDepth
  if (typeof stored !== 'number' || stored <= DEFAULT_TREE_MAX_DEPTH) return spec
  const { pattern, seed, params } = spec.data.provenance
  const data = generateTreeData(pattern as TreePatternId, seed, {
    maxDepth: DEFAULT_TREE_MAX_DEPTH,
    branchMin: params.branchMin ?? 2,
    branchMax: params.branchMax ?? 4,
  })
  return { ...spec, data }
}

function initExpanded(spec: ChartSpec): string[] {
  if (spec.data.shape !== 'tree') return []
  if (spec.data.expandedNodeIds?.length) {
    return [...spec.data.expandedNodeIds]
  }
  return []
}

function initCollapsed(_spec: ChartSpec): string[] {
  return []
}

function visibleTreeRowIds(
  root: DataNode,
  expanded: string[],
  collapsed: string[],
  defaultExpandedDepth: number,
): string[] {
  return flattenVisibleTree(root, expanded, collapsed, defaultExpandedDepth).map((r) => r.id)
}

function startTreeReveal(
  s: { ui: UiState },
  root: DataNode,
  defaultExpandedDepth: number,
  beforeExpanded: string[],
  beforeCollapsed: string[],
  afterExpanded: string[],
  afterCollapsed: string[],
) {
  const before = visibleTreeRowIds(root, beforeExpanded, beforeCollapsed, defaultExpandedDepth)
  const after = visibleTreeRowIds(root, afterExpanded, afterCollapsed, defaultExpandedDepth)
  const reveal = after.filter((id) => !before.includes(id))
  const hide = before.filter((id) => !after.includes(id))
  s.ui.treeRevealRowIds = reveal
  s.ui.treeHideRowIds = hide
  s.ui.treeAnimLayoutExpanded = beforeExpanded
  s.ui.treeAnimLayoutCollapsed = beforeCollapsed
  s.ui.treeAnimUseBeforeLayout = hide.length > 0
}

const loadedBundle = loadAutosaveBundle()
const initialSpecsByVariant =
  loadedBundle?.specsByVariant ?? createInitialSpecsBundle()
const initialHeatmapSpec = loadedBundle?.heatmapSpec ?? createHeatmapSpec()
const initialSelected = loadedBundle?.selectedChart ?? 'classic'
const initialSpec =
  initialSelected === 'heatmap' ? initialHeatmapSpec : initialSpecsByVariant[initialSelected]
const initialTheme = loadTheme()
const initialShell = loadShellLayout()
applyDocumentTheme(initialTheme)

const useTemporalStore = create<EditorState>()(
  temporal(
    immer((set, get) => ({
      spec: initialSpec,
      specsByVariant: initialSpecsByVariant,
      heatmapSpec: initialHeatmapSpec,
      selectedChart: initialSelected,
      ui: {
        inspectorTab: 'settings',
        theme: initialTheme,
        inspectorWidth: initialShell.inspectorWidth,
        hoverId: null,
        selectId: null,
        expandedNodeIds: initExpanded(initialSpec),
        collapsedNodeIds: initCollapsed(initialSpec),
        targetZoom: 1,
        animStart: performance.now(),
        animKey: 0,
        treeRevealAnimStart: null,
        treeRevealRowIds: [],
        treeHideRowIds: [],
        treeAnimUseBeforeLayout: false,
        treeAnimLayoutExpanded: [],
        treeAnimLayoutCollapsed: [],
        treeLayoutFromHeight: 400,
        previewShowAllCharts: false,
        paletteWheelInView: true,
        treeUiByVariant: {},
      },

      setSpec: (updater) =>
        set((state) => {
          syncActiveSpecSlot(state)
          updater(state.spec)
          if (isBarChartSpec(state.spec)) {
            state.spec = syncVariantField(state.spec)
          }
          persistActiveSpecSlot(state)
          finishBundleMutation(state)
        }),

      setSharedSpec: (updater) =>
        set((state) => {
          syncActiveSpecSlot(state)
          updater(state.spec)
          if (state.selectedChart === 'heatmap') {
            if (isBarChartSpec(state.spec)) return
            state.heatmapSpec = state.spec
          } else {
            if (!isBarChartSpec(state.spec)) return
            state.spec = syncVariantField(state.spec)
            persistActiveSpecSlot(state)
            syncSharedToAllBarVariants(state)
          }
          finishBundleMutation(state)
        }),

      replaceSpec: (spec) =>
        set((state) => {
          if (isBarChartSpec(spec)) {
            const next = syncVariantField(spec) as BarChartSpec
            state.spec = next
            state.specsByVariant[next.variant] = next
            state.selectedChart = next.variant
          } else {
            state.spec = spec
            state.heatmapSpec = spec
            state.selectedChart = 'heatmap'
          }
          loadTreeUiForSpec(state, state.spec)
        }),

      selectChart: (chart) => {
        set((state) => {
          if (state.selectedChart === chart) return
          persistActiveSpecSlot(state)
          if (state.selectedChart !== 'heatmap') {
            saveTreeUiForVariant(state)
          }
          state.selectedChart = chart
          syncActiveSpecSlot(state)
          loadTreeUiForSpec(state, state.spec)
          state.ui.hoverId = null
          state.ui.selectId = null
          finishBundleMutation(state)
        })
      },

      selectVariant: (variant) => {
        get().selectChart(variant)
      },

      setVariant: (variant) => {
        get().selectChart(variant)
      },

      setPreviewShowAllCharts: (show) =>
        set((state) => {
          state.ui.previewShowAllCharts = show
        }),

      regenerateAllData: (patch) => {
        set((state) => {
          if (state.selectedChart === 'heatmap') {
            const params = { ...unifiedParamsFromHeatmap(state.heatmapSpec), ...patch }
            applyUnifiedDataToHeatmap(state.heatmapSpec, params)
            afterHeatmapDataRefresh(state)
          } else {
            const params = { ...unifiedParamsFromSpecs(state.specsByVariant), ...patch }
            applyUnifiedDataToBundle(state.specsByVariant, params)
            afterBarDataRefresh(state)
          }
          finishBundleMutation(state)
        })
      },

      setPattern: (pattern) => {
        get().regenerateAllData({ pattern: pattern as TabularPatternId })
      },

      randomize: () => {
        set((state) => {
          if (!state.spec.data.provenance) return
          if (state.selectedChart === 'heatmap') {
            const params = {
              ...unifiedParamsFromHeatmap(state.heatmapSpec),
              seed: randomizeSeed(),
            }
            applyUnifiedDataToHeatmap(state.heatmapSpec, params)
            afterHeatmapDataRefresh(state)
          } else {
            const params = {
              ...unifiedParamsFromSpecs(state.specsByVariant),
              seed: randomizeSeed(),
            }
            applyUnifiedDataToBundle(state.specsByVariant, params)
            afterBarDataRefresh(state)
          }
          finishBundleMutation(state)
        })
      },

      setTheme: (theme) =>
        set((state) => {
          if (state.ui.theme === theme) return
          state.ui.theme = theme
          applyDocumentTheme(theme)
          localStorage.setItem(THEME_STORAGE_KEY, theme)
        }),

      toggleTheme: () => {
        const t = get().ui.theme === 'dark' ? 'light' : 'dark'
        get().setTheme(t)
      },

      setInspectorTab: (tab) =>
        set((s) => {
          s.ui.inspectorTab = tab
          if (tab !== 'colors') s.ui.paletteWheelInView = true
        }),

      setPaletteWheelInView: (inView) =>
        set((s) => {
          s.ui.paletteWheelInView = inView
        }),

      setInspectorWidth: (w) =>
        set((s) => {
          s.ui.inspectorWidth = clampShell(w, INSPECTOR_WIDTH_MIN, INSPECTOR_WIDTH_MAX)
          saveShellLayout(s.ui.inspectorWidth)
        }),

      setHoverId: (id) => set((s) => { s.ui.hoverId = id }),
      setSelectId: (id) => set((s) => { s.ui.selectId = id }),

      toggleNode: (id) =>
        set((s) => {
          if (s.spec.data.shape !== 'tree') return
          const { root, defaultExpandedDepth } = s.spec.data
          const found = findTreeNode(root, id)
          if (!found?.node.children?.length) return

          const beforeExpanded = [...s.ui.expandedNodeIds]
          const beforeCollapsed = [...s.ui.collapsedNodeIds]
          let expanded = [...beforeExpanded]
          let collapsed = [...beforeCollapsed]
          const currently = isTreeNodeExpanded(
            found.node,
            found.depth,
            expanded,
            collapsed,
            defaultExpandedDepth,
          )

          if (currently) {
            if (!collapsed.includes(id)) collapsed.push(id)
            expanded = expanded.filter((x) => x !== id)
          } else {
            collapsed = collapsed.filter((x) => x !== id)
            if (!expanded.includes(id)) expanded.push(id)
          }

          s.ui.expandedNodeIds = expanded
          s.ui.collapsedNodeIds = collapsed
          startTreeReveal(
            s,
            root,
            defaultExpandedDepth,
            beforeExpanded,
            beforeCollapsed,
            expanded,
            collapsed,
          )
        }),

      expandAll: () =>
        set((s) => {
          if (s.spec.data.shape !== 'tree') return
          const { root, defaultExpandedDepth } = s.spec.data
          const beforeExpanded = [...s.ui.expandedNodeIds]
          const beforeCollapsed = [...s.ui.collapsedNodeIds]
          const expanded = allExpandedIds(root)
          s.ui.expandedNodeIds = expanded
          s.ui.collapsedNodeIds = []
          startTreeReveal(
            s,
            root,
            defaultExpandedDepth,
            beforeExpanded,
            beforeCollapsed,
            expanded,
            [],
          )
        }),

      collapseAll: () =>
        set((s) => {
          if (s.spec.data.shape !== 'tree') return
          const { root, defaultExpandedDepth } = s.spec.data
          const beforeExpanded = [...s.ui.expandedNodeIds]
          const beforeCollapsed = [...s.ui.collapsedNodeIds]
          const afterExpanded: string[] = []
          const afterCollapsed = allExpandedIds(root)
          startTreeReveal(
            s,
            root,
            defaultExpandedDepth,
            beforeExpanded,
            beforeCollapsed,
            afterExpanded,
            afterCollapsed,
          )
          s.ui.expandedNodeIds = afterExpanded
          s.ui.collapsedNodeIds = afterCollapsed
        }),

      beginTreeLayoutAnim: (fromDisplayHeight) =>
        set((s) => {
          s.ui.treeLayoutFromHeight = Math.max(0, fromDisplayHeight)
          s.ui.treeRevealAnimStart = performance.now()
        }),

      clearTreeRevealAnim: () =>
        set((s) => {
          s.ui.treeRevealRowIds = []
          s.ui.treeHideRowIds = []
          s.ui.treeAnimUseBeforeLayout = false
          s.ui.treeRevealAnimStart = null
        }),

      setTargetZoom: (z) =>
        set((s) => {
          s.ui.targetZoom = Math.min(3, Math.max(0.1, z))
        }),
      zoomIn: () =>
        set((s) => {
          s.ui.targetZoom = Math.min(3, s.ui.targetZoom * 1.1)
        }),
      zoomOut: () =>
        set((s) => {
          s.ui.targetZoom = Math.max(0.1, s.ui.targetZoom / 1.1)
        }),
      zoomToFit: (fitScale) =>
        set((s) => {
          s.ui.targetZoom = Math.min(3, Math.max(0.1, fitScale))
        }),
      zoomTo100: () => set((s) => { s.ui.targetZoom = 1 }),
      replayAnimation: () =>
        set((s) => {
          s.ui.animStart = performance.now()
          s.ui.animKey += 1
        }),

      exportSpec: () => {
        const { spec, ui } = get()
        return specForExport(spec, ui.expandedNodeIds)
      },

      exportBundle: () => {
        const { selectedChart, specsByVariant, heatmapSpec, ui } = get()
        const hierarchyExpanded =
          ui.treeUiByVariant.hierarchy?.expandedNodeIds ?? []
        return bundleForExport(selectedChart, specsByVariant, heatmapSpec, hierarchyExpanded)
      },

      importSpec: (json) => {
        const parsed = parseImportedPayload(json)
        set((state) => {
          if (parsed.kind === 'bundle-v3') {
            const { selectedChart, specsByVariant, heatmapSpec } = parsed.bundle
            state.specsByVariant = specsByVariant
            state.heatmapSpec = heatmapSpec
            state.selectedChart = selectedChart
            syncActiveSpecSlot(state)
          } else if (parsed.kind === 'bundle-v2') {
            const { selectedVariant, specsByVariant } = parsed.bundle
            state.specsByVariant = specsByVariant
            state.selectedChart = selectedVariant
            syncActiveSpecSlot(state)
          } else if (isBarChartSpec(parsed.spec)) {
            const bundle = createDefaultSpecsBundle(parsed.spec)
            state.specsByVariant = bundle
            state.selectedChart = parsed.spec.variant
            syncActiveSpecSlot(state)
          } else {
            state.heatmapSpec = parsed.spec
            state.selectedChart = 'heatmap'
            syncActiveSpecSlot(state)
          }
          loadTreeUiForSpec(state, state.spec)
          state.ui.animStart = performance.now()
          state.ui.animKey += 1
          finishBundleMutation(state)
        })
      },

      resetToDefault: () => {
        set((state) => {
          const bundle = createInitialSpecsBundle()
          state.specsByVariant = bundle
          state.heatmapSpec = createHeatmapSpec()
          state.selectedChart = 'classic'
          syncActiveSpecSlot(state)
          loadTreeUiForSpec(state, state.spec)
          finishBundleMutation(state)
        })
      },

      undo: () => {
        useTemporalStore.temporal.getState().undo()
      },
      redo: () => {
        useTemporalStore.temporal.getState().redo()
      },
    })),
    {
      partialize: (state) => ({
        spec: state.spec,
        specsByVariant: state.specsByVariant,
        heatmapSpec: state.heatmapSpec,
        selectedChart: state.selectedChart,
      }),
      limit: 100,
    },
  ),
)

export const useEditorStore = useTemporalStore

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
useEditorStore.subscribe(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    const payload = useEditorStore.getState().exportBundle()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, 400)
})

export function getPatternLabel(spec: ChartSpec): string {
  if (spec.data.provenance === null) return 'Custom'
  return spec.data.provenance.pattern
}

export function getVariantFromSpec(spec: ChartSpec): ChartVariant {
  return deriveVariant(spec.data, spec.layout)
}
