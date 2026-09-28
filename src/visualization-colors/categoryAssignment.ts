export function reconcileAssignments(
  orderedIds: string[],
  existing: Record<string, number> | undefined,
  paletteSize: number,
): Record<string, number> {
  const next: Record<string, number> = {}
  const used = new Set<number>()

  for (const id of orderedIds) {
    const prev = existing?.[id]
    if (prev != null && prev >= 0 && prev < paletteSize && !used.has(prev)) {
      next[id] = prev
      used.add(prev)
    }
  }

  let cursor = 0
  for (const id of orderedIds) {
    if (id in next) continue
    while (cursor < paletteSize && used.has(cursor)) cursor++
    const index = cursor < paletteSize ? cursor : cursor % Math.max(paletteSize, 1)
    next[id] = index
    used.add(index)
    cursor = index + 1
  }

  return next
}

export function assignmentIndex(
  assignments: Record<string, number> | undefined,
  id: string,
  fallbackIndex: number,
): number {
  const v = assignments?.[id]
  return v != null && v >= 0 ? v : fallbackIndex
}
