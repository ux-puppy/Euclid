import type { AnimationConfig, ChartSpec } from '../../chart-spec/types'
import { computeAnimProgress, getEasingFn } from '../../render/animation'

/**
 * Row slot progress within a fixed wall-clock window: delay + duration (stagger does not extend total time).
 * Multiple rows share the duration window sequentially when total > 1.
 */
function slotProgressInFixedWindow(
  anim: AnimationConfig,
  elapsedMs: number,
  index: number,
  total: number,
): number {
  if (!anim.enabled) return 1
  const afterDelay = elapsedMs - anim.delay
  if (afterDelay <= 0) return 0
  if (total <= 1) {
    const t = Math.min(1, afterDelay / anim.duration)
    return getEasingFn(anim)(t)
  }
  const segment = anim.duration / total
  const local = afterDelay - index * segment
  if (local <= 0) return 0
  if (local >= segment) return 1
  return getEasingFn(anim)(local / segment)
}

/** Single 0–1 progress for hierarchy expand/collapse (all rows in a section move together). */
export function treeLayoutSectionProgress(
  spec: ChartSpec,
  treeRevealAnimStart: number | null,
): number {
  if (!spec.animation.enabled || treeRevealAnimStart == null) return 1
  const elapsed = performance.now() - treeRevealAnimStart
  return slotProgressInFixedWindow(spec.animation, elapsed, 0, 1)
}

export function isTreeLayoutAnimating(
  spec: ChartSpec,
  treeRevealAnimStart: number | null,
  revealRowIds: readonly string[],
  hideRowIds: readonly string[],
): boolean {
  if (!spec.animation.enabled || treeRevealAnimStart == null) return false
  if (revealRowIds.length === 0 && hideRowIds.length === 0) return false
  const elapsed = performance.now() - treeRevealAnimStart
  const anim = spec.animation
  return elapsed < anim.delay + anim.duration + 32
}

/** Bar grow progress for hierarchy rows: load stagger once, then only newly revealed rows. */
export function hierarchyRowAnimProgress(
  spec: ChartSpec,
  _rowId: string,
  rowIndex: number,
  loadElapsedMs: number,
  treeRevealAnimStart: number | null,
  revealRowIds: readonly string[],
): number {
  if (spec.variant !== 'hierarchy' || !spec.animation.enabled) return 1

  if (treeRevealAnimStart != null && revealRowIds.length > 0) {
    return 1
  }

  const loadEnd =
    spec.animation.delay +
    spec.animation.duration +
    spec.animation.stagger * rowIndex
  if (loadElapsedMs < loadEnd + 16) {
    return computeAnimProgress(spec.animation, loadElapsedMs, rowIndex)
  }
  return 1
}
