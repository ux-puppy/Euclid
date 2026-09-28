import type { DataNode } from '../../chart-spec/types'

export type FlatTreeRow = {
  id: string
  label: string
  value: number
  depth: number
  /** Depth from the top-level branch root (0 = branch root row). */
  depthInBranch: number
  branchRootId: string | null
  hasChildren: boolean
  expanded: boolean
  parentId: string | null
  color?: string
}

export function collectExpandableIds(root: DataNode): string[] {
  const ids: string[] = []
  const walk = (node: DataNode) => {
    if (node.children?.length) {
      ids.push(node.id)
      node.children.forEach(walk)
    }
  }
  walk(root)
  return ids
}

export function findTreeNode(
  root: DataNode,
  id: string,
): { node: DataNode; depth: number } | null {
  let found: { node: DataNode; depth: number } | null = null

  const walk = (node: DataNode, depth: number) => {
    if (found) return
    if (node.id === id) {
      found = { node, depth }
      return
    }
    node.children?.forEach((child) => walk(child, depth + 1))
  }

  if (root.id === 'virtual-root' && root.children) {
    root.children.forEach((c) => walk(c, 0))
  } else {
    walk(root, 0)
  }
  return found
}

export function isTreeNodeExpanded(
  node: DataNode,
  depth: number,
  expandedIds: readonly string[],
  collapsedIds: readonly string[],
  defaultExpandedDepth: number,
): boolean {
  const hasChildren = Boolean(node.children?.length)
  if (!hasChildren) return false
  if (collapsedIds.includes(node.id)) return false
  if (expandedIds.includes(node.id)) return true
  return depth < defaultExpandedDepth
}

export function flattenVisibleTree(
  root: DataNode,
  expandedIds: readonly string[],
  collapsedIds: readonly string[],
  defaultExpandedDepth: number,
): FlatTreeRow[] {
  const rows: FlatTreeRow[] = []

  const walk = (
    node: DataNode,
    depth: number,
    parentId: string | null,
    branchRootId: string | null,
    depthInBranch: number,
  ) => {
    const hasChildren = Boolean(node.children?.length)
    const expanded = isTreeNodeExpanded(
      node,
      depth,
      expandedIds,
      collapsedIds,
      defaultExpandedDepth,
    )
    rows.push({
      id: node.id,
      label: node.label,
      value: node.value,
      depth,
      depthInBranch,
      branchRootId,
      hasChildren,
      expanded,
      parentId,
      color: node.color,
    })
    if (hasChildren && expanded) {
      node.children!.forEach((child) =>
        walk(child, depth + 1, node.id, branchRootId, depthInBranch + 1),
      )
    }
  }

  if (root.id === 'virtual-root' && root.children) {
    root.children.forEach((c) => walk(c, 0, null, c.id, 0))
  } else {
    walk(root, 0, null, root.id, 0)
  }

  return rows
}

export function allExpandedIds(root: DataNode): string[] {
  return collectExpandableIds(root)
}
