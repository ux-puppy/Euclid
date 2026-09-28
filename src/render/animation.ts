import bezierEasing from 'bezier-easing'
import type { AnimationConfig } from '../chart-spec/types'

export function getEasingFn(config: AnimationConfig): (t: number) => number {
  switch (config.easing) {
    case 'linear':
      return (t) => t
    case 'ease-in':
      return bezierEasing(0.42, 0, 1, 1)
    case 'ease-out':
      return bezierEasing(0, 0, 0.58, 1)
    case 'ease-in-out':
      return bezierEasing(0.42, 0, 0.58, 1)
    case 'spring':
      return bezierEasing(0.34, 1.56, 0.64, 1)
    case 'custom':
      return bezierEasing(...config.customBezier)
    default:
      return bezierEasing(...config.customBezier)
  }
}

export function computeAnimProgress(
  config: AnimationConfig,
  elapsedMs: number,
  itemIndex: number,
): number {
  if (!config.enabled) return 1
  const staggered = elapsedMs - config.delay - itemIndex * config.stagger
  if (staggered <= 0) return 0
  const t = Math.min(1, staggered / config.duration)
  const ease = getEasingFn(config)
  return ease(t)
}
