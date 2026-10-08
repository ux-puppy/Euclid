import { describe, expect, it } from 'vitest'
import { contrastRatio, passesContrastThreshold } from './contrast'

describe('contrast', () => {
  it('computes black on white', () => {
    const r = contrastRatio('#000000', '#ffffff')
    expect(r).not.toBeNull()
    expect(r!).toBeCloseTo(21, 0)
  })

  it('checks custom threshold', () => {
    expect(passesContrastThreshold(4.5, 4.5)).toBe(true)
    expect(passesContrastThreshold(3, 4.5)).toBe(false)
    expect(passesContrastThreshold(null, 3)).toBe(false)
  })
})
