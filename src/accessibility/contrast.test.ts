import { describe, expect, it } from 'vitest'
import { labelOnFill, labelOnFillOverBackground } from './contrast'

describe('labelOnFillOverBackground', () => {
  it('matches labelOnFill for opaque fills', () => {
    expect(labelOnFillOverBackground('#336699', '#ffffff')).toBe(labelOnFill('#336699'))
  })

  it('uses composited color on a light background for transparent fill', () => {
    expect(labelOnFill('#000000')).toBe('#fff')
    expect(labelOnFillOverBackground('#00000000', '#ffffff')).toBe('#000')
  })
})
