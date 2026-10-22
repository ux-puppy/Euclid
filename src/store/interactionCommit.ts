import { useEditorStore } from './editorStore'

let interactionDepth = 0
let pendingCommit: (() => void) | null = null
let rafId = 0

export function scheduleCoalescedCommit(fn: () => void) {
  pendingCommit = fn
  if (rafId !== 0) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    const run = pendingCommit
    pendingCommit = null
    run?.()
  })
}

export function flushCoalescedCommit() {
  if (rafId !== 0) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  const run = pendingCommit
  pendingCommit = null
  run?.()
}

export function beginCoalescedInteraction() {
  interactionDepth += 1
  if (interactionDepth === 1) {
    useEditorStore.getState().setInteractionActive(true)
    useEditorStore.temporal.getState().pause()
  }
}

export function endCoalescedInteraction(finalFn?: () => void) {
  flushCoalescedCommit()
  finalFn?.()
  interactionDepth = Math.max(0, interactionDepth - 1)
  if (interactionDepth === 0) {
    useEditorStore.temporal.getState().resume()
    useEditorStore.getState().setInteractionActive(false)
  }
}

/** Reset coalescer state (tests only). */
export function resetInteractionCommitForTests() {
  if (rafId !== 0) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  pendingCommit = null
  interactionDepth = 0
}
