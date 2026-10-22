import { describe, expect, it } from 'vitest'
import { generateTabularValues, scaleTabularValuesForHeatmap } from './tabular'

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

  it('non–positive-negative values sit in 0–100', () => {
    const matrix = generateTabularValues('random', 99, 8, 4)
    const flat = matrix.flat()
    for (const v of flat) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
    expect(Math.max(...flat)).toBeCloseTo(100, 5)
  })

  it('positive-negative stays in [-100, 100] with both signs', () => {
    const matrix = generateTabularValues('positive-negative', 99, 8, 4)
    const flat = matrix.flat()
    expect(flat.some((v) => v < 0)).toBe(true)
    expect(flat.some((v) => v > 0)).toBe(true)
    for (const v of flat) {
      expect(v).toBeGreaterThanOrEqual(-100)
      expect(v).toBeLessThanOrEqual(100)
    }
    const maxAbs = Math.max(...flat.map(Math.abs))
    expect(maxAbs).toBeCloseTo(100, 5)
  })

  it('series pattern scales rows independently of category pattern', () => {
    const increasing = generateTabularValues('uniform', 42, 4, 4, 'increasing')
    const decreasing = generateTabularValues('uniform', 42, 4, 4, 'decreasing')
    const rowSum = (row: number[]) => row.reduce((a, b) => a + b, 0)
    expect(rowSum(increasing[0]!)).toBeLessThan(rowSum(increasing[3]!))
    expect(rowSum(decreasing[0]!)).toBeGreaterThan(rowSum(decreasing[3]!))
  })

  it('scaleTabularValuesForHeatmap maps unit range to 0–100 or −100–100', () => {
    expect(scaleTabularValuesForHeatmap([0, 0.5, 1])).toEqual([0, 50, 100])
    const signed = scaleTabularValuesForHeatmap([-1, 0, 1])
    expect(signed).toEqual([-100, 0, 100])
  })
})
