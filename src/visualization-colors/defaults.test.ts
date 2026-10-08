import { describe, expect, it } from 'vitest'
import { resolveHueLayout } from './defaults'

describe('resolveHueLayout', () => {
  it('migrates legacy greedy (revision 1) to even', () => {
    expect(resolveHueLayout({ hueLayout: 'greedy', paletteRevision: 1 })).toBe('even')
    expect(resolveHueLayout({ hueLayout: 'greedy' })).toBe('even')
  })

  it('keeps greedy when paletteRevision is 2', () => {
    expect(resolveHueLayout({ hueLayout: 'greedy', paletteRevision: 2 })).toBe('greedy')
  })
})
