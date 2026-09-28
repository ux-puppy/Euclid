export type ValueAnimState = {
  /** Eased 0–1 progress for value transitions. */
  t: number
  /** Previous target bar widths by hit id; null = initial load (grow from zero). */
  from: Record<string, number> | null
}

export function isValueLerpActive(valueAnim?: ValueAnimState): boolean {
  if (!valueAnim?.from || valueAnim.t >= 1) return false
  return Object.keys(valueAnim.from).length > 0
}

export function resolveBarWidth(
  id: string,
  targetWidth: number,
  loadProgress: number,
  valueAnim?: ValueAnimState,
): number {
  if (isValueLerpActive(valueAnim)) {
    const from = valueAnim!.from![id] ?? 0
    return from + (targetWidth - from) * valueAnim!.t
  }
  return targetWidth * loadProgress
}
