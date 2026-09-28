import type { TabularPatternId } from '../../chart-spec/types'
import { mulberry32 } from '../prng'
import { generateCountryNames, generateStateNames } from './geoLabels'

export function generateCategories(count: number, seed: number): string[] {
  return generateCountryNames(count, seed)
}

export function generateSeriesNames(count: number, seed: number): string[] {
  return generateStateNames(count, seed)
}

function normalizeToUnit(values: number[]): number[] {
  const max = Math.max(...values, 1e-9)
  return values.map((v) => v / max)
}

export function generateTabularValues(
  pattern: TabularPatternId,
  seed: number,
  categoryCount: number,
  seriesCount: number,
): number[][] {
  const seriesValues: number[][] = []
  for (let s = 0; s < seriesCount; s++) {
    const rng = mulberry32(seed + s * 1000)
    const values: number[] = []
    for (let c = 0; c < categoryCount; c++) {
      const t = categoryCount <= 1 ? 0.5 : c / (categoryCount - 1)
      let v = rng()
      switch (pattern) {
        case 'increasing':
          v = 0.2 + t * 0.7 + rng() * 0.1
          break
        case 'decreasing':
          v = 0.9 - t * 0.7 + rng() * 0.1
          break
        case 'bell-curve':
          v = Math.exp(-Math.pow((t - 0.5) / 0.18, 2)) * 0.85 + rng() * 0.1
          break
        case 'wave':
          v = 0.5 + 0.35 * Math.sin((t + s * 0.15) * Math.PI * 4) + rng() * 0.08
          break
        case 'peaks-valleys':
          v = c % 2 === 0 ? 0.75 + rng() * 0.2 : 0.15 + rng() * 0.15
          break
        case 'uniform':
          v = 0.45 + rng() * 0.1
          break
        case 'clustered':
          v = c < categoryCount / 2 ? 0.7 + rng() * 0.25 : 0.1 + rng() * 0.15
          break
        case 'outliers':
          v = 0.35 + rng() * 0.2
          if (rng() > 0.88) v = 0.95 + rng() * 0.05
          break
        case 'positive-negative':
          v = (t - 0.5) * 1.2 + (rng() - 0.5) * 0.3
          break
        case 'sparse':
          v = rng() > 0.65 ? 0.6 + rng() * 0.35 : 0.02 + rng() * 0.05
          break
        case 'random':
        default:
          v = 0.1 + rng() * 0.85
      }
      values.push(Math.max(0, v))
    }
    if (pattern === 'positive-negative') {
      const absMax = Math.max(...values.map(Math.abs), 1e-9)
      seriesValues.push(values.map((x) => (x / absMax + 1) / 2))
    } else {
      seriesValues.push(normalizeToUnit(values))
    }
  }
  return seriesValues
}
