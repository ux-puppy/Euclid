import { describe, expect, it } from 'vitest'
import {
  contrastRatioFillOnBackground,
  contrastRatioVizTextOnFill,
} from './contrast'
import { resolveSurfaceForTheme } from '../chart-spec/surfaceColors'
import { createInitialSpecsBundle } from '../chart-spec/defaults'

describe('composite contrast helpers', () => {
  it('uses chart surface textSecondary on fill', () => {
    const spec = createInitialSpecsBundle().classic
    const surface = resolveSurfaceForTheme(spec.colors, 'light')
    const fill = '#c8d4e8'
    expect(contrastRatioVizTextOnFill(surface.textSecondary, fill)).not.toBeNull()
  })

  it('composites translucent fill on chart background', () => {
    const spec = createInitialSpecsBundle().classic
    const surface = resolveSurfaceForTheme(spec.colors, 'light')
    expect(contrastRatioFillOnBackground('rgba(100,120,200,0.6)', surface.background)).not.toBeNull()
  })
})
