import { describe, expect, it } from 'vitest'
import { resolveBarWidth } from './valueAnim'

describe('resolveBarWidth', () => {
  it('lerps from previous target when value anim active', () => {
    const w = resolveBarWidth('a', 150, 1, { t: 0.5, from: { a: 120 } })
    expect(w).toBe(135)
  })

  it('uses load progress when no value anim snapshot', () => {
    const w = resolveBarWidth('a', 150, 0.5, { t: 0.5, from: null })
    expect(w).toBe(75)
  })
})
