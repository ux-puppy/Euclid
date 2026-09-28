import type { EasingPreset } from './types'

export type Bezier4 = [number, number, number, number]

export const EASING_BEZIER: Record<EasingPreset, Bezier4> = {
  linear: [0, 0, 1, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  spring: [0.34, 1.56, 0.64, 1],
  custom: [0, 0, 0.58, 1],
}
