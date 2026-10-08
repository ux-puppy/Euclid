import type { DataNode, TreePatternId } from '../../chart-spec/types'
import { mulberry32, randomInt } from '../prng'
import { SPECIES_NAMES, animalNameForTreeDepth } from './animalLabels'

function pickName(_rng: () => number, depth: number, index: number): string {
  return animalNameForTreeDepth(depth, index)
}

function distributeShares(count: number, rng: () => number): number[] {
  const raw = Array.from({ length: count }, () => 0.2 + rng())
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => v / sum)
}

function buildNode(
  rng: () => number,
  id: string,
  label: string,
  value: number,
  depth: number,
  maxDepth: number,
  branchMin: number,
  branchMax: number,
  pattern: TreePatternId,
): DataNode {
  const node: DataNode = { id, label, value }
  if (depth >= maxDepth) return node

  let childCount = randomInt(rng, branchMin, branchMax)
  if (pattern === 'skewed' && depth === 0) childCount = branchMax
  if (pattern === 'wide-shallow' && depth === 0) childCount = branchMax
  if (pattern === 'wide-shallow' && depth >= 1) return node

  const shares = distributeShares(childCount, rng)
  const children: DataNode[] = []
  for (let i = 0; i < childCount; i++) {
    const childId = `${id}-${i}`
    const childLabel = pickName(rng, depth + 1, i)
    let childValue = shares[i]! * value
    if (pattern === 'skewed' && i === 0 && depth < maxDepth - 1) {
      childValue = value * 0.55
    }
    children.push(
      buildNode(
        mulberry32(Math.floor(rng() * 1e9)),
        childId,
        childLabel,
        childValue,
        depth + 1,
        maxDepth,
        branchMin,
        branchMax,
        pattern === 'skewed' && i === 0 ? 'skewed' : pattern,
      ),
    )
  }
  if (pattern === 'skewed' && depth === 0 && children[0]) {
    const rest = value * 0.45
    const others = children.slice(1)
    const oSum = others.reduce((s, c) => s + c.value, 0) || 1
    others.forEach((c) => {
      c.value = (c.value / oSum) * rest
    })
    children[0].value = value * 0.55
  }
  node.children = children
  return node
}

export function generateTreeRoot(
  pattern: TreePatternId,
  seed: number,
  params: { maxDepth: number; branchMin: number; branchMax: number },
): DataNode {
  const rng = mulberry32(seed)
  const rootLabel = SPECIES_NAMES[0]!
  const root = buildNode(
    rng,
    'root-0',
    rootLabel,
    100,
    0,
    params.maxDepth,
    params.branchMin,
    params.branchMax,
    pattern,
  )
  const siblings = randomInt(rng, 2, 4)
  if (pattern === 'balanced' || pattern === 'random-tree') {
    const shares = distributeShares(siblings, rng)
    const roots: DataNode[] = [root]
    for (let i = 1; i < siblings; i++) {
      roots.push(
        buildNode(
          mulberry32(seed + i * 77),
          `root-${i}`,
          pickName(rng, 0, i),
          shares[i]!,
          0,
          params.maxDepth,
          params.branchMin,
          params.branchMax,
          pattern,
        ),
      )
    }
    const sum = roots.reduce((s, n) => s + n.value, 0)
    roots.forEach((n) => {
      n.value = (n.value / sum) * 100
    })
    return {
      id: 'virtual-root',
      label: 'All',
      value: 100,
      children: roots,
    }
  }
  return root
}
