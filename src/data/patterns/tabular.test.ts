import { describe, expect, it } from 'vitest'
import { generateTabularValues } from './tabular'

describe('tabular patterns', () => {
  it('same seed produces identical values', () => {
    const a = generateTabularValues('bell-curve', 42, 4, 3)
    const b = generateTabularValues('bell-curve', 42, 4, 3)
    expect(a).toEqual(b)
  })

  it('different seeds produce different values', () => {
    const a = generateTabularValues('random', 1, 4, 2)
    const b = generateTabularValues('random', 2, 4, 2)
    expect(a).not.toEqual(b)
  })
})
