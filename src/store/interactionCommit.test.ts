import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  flushCoalescedCommit,
  resetInteractionCommitForTests,
  scheduleCoalescedCommit,
} from './interactionCommit'

describe('interactionCommit', () => {
  beforeEach(() => {
    resetInteractionCommitForTests()
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
  })

  afterEach(() => {
    resetInteractionCommitForTests()
    vi.useRealTimers()
  })

  it('runs at most one scheduled commit per animation frame', () => {
    const runs: number[] = []
    scheduleCoalescedCommit(() => runs.push(1))
    scheduleCoalescedCommit(() => runs.push(2))
    scheduleCoalescedCommit(() => runs.push(3))

    expect(runs).toEqual([])
    vi.runAllTimers()
    expect(runs).toEqual([3])
  })

  it('flushCoalescedCommit runs pending commit immediately', () => {
    let n = 0
    scheduleCoalescedCommit(() => {
      n = 7
    })
    flushCoalescedCommit()
    expect(n).toBe(7)
    vi.runAllTimers()
    expect(n).toBe(7)
  })
})
