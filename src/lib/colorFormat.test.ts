import { describe, expect, it } from 'vitest'
import { colorTokenToDisplayHex } from './colorFormat'

describe('colorTokenToDisplayHex', () => {
  it('converts rgba tokens to uppercase hex8', () => {
    expect(colorTokenToDisplayHex('rgba(255,255,255,0.5)')).toMatch(
      /^#[0-9A-F]{8}$/,
    )
    expect(colorTokenToDisplayHex('rgba(0,0,0,0.5)')).toBe('#00000080')
  })

  it('normalizes hex to uppercase', () => {
    expect(colorTokenToDisplayHex('#ffffff')).toBe('#FFFFFF')
  })
})
