import type { TabularPatternId } from '../../chart-spec/types'
import { mulberry32 } from '../prng'
import { generateSpeciesNames, generateSubspeciesNames } from './animalLabels'

export function generateCategories(count: number, seed: number): string[] {
  return generateSpeciesNames(count, seed)
}

export function generateSeriesNames(count: number, seed: number): string[] {
  return generateSubspeciesNames(count, seed)
}

const SAMPLE_VALUE_MAX = 100

/** Per-series weight from the series data-shape (independent of category pattern). */
function seriesShapeMultiplier(
  seriesPattern: TabularPatternId,
  s: number,
  seriesCount: number,
  seed: number,
): number {
  const t = seriesCount <= 1 ? 0.5 : s / (seriesCount - 1)
  const rng = mulberry32(seed + s * 7777 + 91)
  switch (seriesPattern) {
    case 'increasing':
      return 0.3 + t * 0.7
    case 'decreasing':
      return 1 - t * 0.7
    case 'bell-curve':
      return 0.25 + Math.exp(-Math.pow((t - 0.5) / 0.22, 2)) * 0.75
    case 'wave':
      return 0.45 + 0.35 * Math.sin(t * Math.PI * 3 + 0.4)
    case 'peaks-valleys':
      return s % 2 === 0 ? 0.85 + rng() * 0.15 : 0.35 + rng() * 0.2
    case 'uniform':
      return 0.9 + rng() * 0.1
    case 'clustered':
      return s < seriesCount / 2 ? 0.75 + rng() * 0.2 : 0.35 + rng() * 0.15
    case 'outliers':
      return rng() > 0.82 ? 1.05 + rng() * 0.2 : 0.55 + rng() * 0.25
    case 'positive-negative':
      return 0.4 + t * 0.6
    case 'sparse':
      return rng() > 0.55 ? 0.75 + rng() * 0.25 : 0.15 + rng() * 0.1
    case 'random':
    default:
      return 0.35 + rng() * 0.65
  }
}

function rawCategoryValue(
  pattern: TabularPatternId,
  t: number,
  c: number,
  categoryCount: number,
  rng: () => number,
): number {
  switch (pattern) {
    case 'increasing':
      return 0.2 + t * 0.7 + rng() * 0.1
    case 'decreasing':
      return 0.9 - t * 0.7 + rng() * 0.1
    case 'bell-curve':
      return Math.exp(-Math.pow((t - 0.5) / 0.18, 2)) * 0.85 + rng() * 0.1
    case 'wave':
      return 0.5 + 0.35 * Math.sin(t * Math.PI * 4) + rng() * 0.08
    case 'peaks-valleys':
      return c % 2 === 0 ? 0.75 + rng() * 0.2 : 0.15 + rng() * 0.15
    case 'uniform':
      return 0.45 + rng() * 0.1
    case 'clustered':
      return c < categoryCount / 2 ? 0.7 + rng() * 0.25 : 0.1 + rng() * 0.15
    case 'outliers': {
      let v = 0.35 + rng() * 0.2
      if (rng() > 0.88) v = 0.95 + rng() * 0.05
      return v
    }
    case 'positive-negative':
      return (t - 0.5) * 2 + (rng() - 0.5) * 0.4
    case 'sparse':
      return rng() > 0.65 ? 0.6 + rng() * 0.35 : 0.02 + rng() * 0.05
    case 'random':
    default:
      return 0.1 + rng() * 0.85
  }
}

export function generateTabularValues(
  pattern: TabularPatternId,
  seed: number,
  categoryCount: number,
  seriesCount: number,
  seriesPattern: TabularPatternId = pattern,
): number[][] {
  const raw: number[][] = []

  for (let s = 0; s < seriesCount; s++) {
    const rng = mulberry32(seed + s * 1000)
    const values: number[] = []
    for (let c = 0; c < categoryCount; c++) {
      const t = categoryCount <= 1 ? 0.5 : c / (categoryCount - 1)
      values.push(rawCategoryValue(pattern, t, c, categoryCount, rng))
    }
    raw.push(values)
  }

  const scaled = raw.map((row, s) => {
    const seriesMul = seriesShapeMultiplier(seriesPattern, s, seriesCount, seed)
    return row.map((v) => v * seriesMul)
  })

  if (pattern === 'positive-negative') {
    const absMax = Math.max(...scaled.flatMap((row) => row.map(Math.abs)), 1e-9)
    return scaled.map((row) => row.map((x) => (x / absMax) * SAMPLE_VALUE_MAX))
  }

  const nonNegative = scaled.map((row) => row.map((v) => Math.max(0, v)))
  const globalMax = Math.max(...nonNegative.flat(), 1e-9)
  return nonNegative.map((row) =>
    row.map((v) => (v / globalMax) * SAMPLE_VALUE_MAX),
  )
}

/** Converts legacy 0–1 (or −1–1) unit values to sample range 0–100 / −100–100. */
export function scaleTabularValuesForHeatmap(values: number[]): number[] {
  const maxAbs = Math.max(...values.map(Math.abs), 1e-9)
  if (maxAbs <= 1.001) {
    return values.map((v) => v * SAMPLE_VALUE_MAX)
  }
  return values
}
