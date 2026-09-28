/** Single rAF loop shared by all preview canvases. */

export type PreviewTickerSubscriber = {
  tick: () => void
}

const subscribers = new Set<PreviewTickerSubscriber>()
let rafId = 0

function runFrame() {
  for (const sub of subscribers) {
    sub.tick()
  }
  if (subscribers.size === 0) {
    rafId = 0
    return
  }
  rafId = requestAnimationFrame(runFrame)
}

export function subscribePreviewTicker(subscriber: PreviewTickerSubscriber): () => void {
  subscribers.add(subscriber)
  if (rafId === 0) {
    rafId = requestAnimationFrame(runFrame)
  }
  return () => {
    subscribers.delete(subscriber)
    if (subscribers.size === 0 && rafId !== 0) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }
}
