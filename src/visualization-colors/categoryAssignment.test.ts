import { describe, expect, it } from 'vitest'
import { reconcileAssignments } from './categoryAssignment'

describe('categoryAssignment', () => {
  it('preserves existing ids when palette grows', () => {
    const next = reconcileAssignments(
      ['a', 'b', 'c'],
      { a: 0, b: 2 },
      6,
    )
    expect(next.a).toBe(0)
    expect(next.b).toBe(2)
    expect(next.c).toBe(1)
  })
})
